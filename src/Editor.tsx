import { Box, Paper } from "@mui/material";
import {
  EditorContent,
  type AnyExtension,
  type Editor as TiptapEditor,
  useEditor,
} from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { Icon } from "@iconify/react";
import { IconButton, Typography } from "@mui/material";
import {
  APOSTILA_SHEET,
  computePageMetrics,
  DEFAULT_PAGE_SETUP,
  PageSetupControl,
  type PageSetup,
} from "./documentPage";
import {
  createPaginationExtension,
  PAGE_GAP_PX,
  repaginate,
  type PaginationContext,
} from "./pagination";
import { REGISTRY } from "./features";
import { applyUiOverrides } from "./features/uiOverrides";
import type { FeatureFloatingProps, ToolbarItemSpec } from "./features";
import { Toolbar } from "./Toolbar";
import type { EditorContentValue, EditorHandle, EditorProps } from "./types";

/** Required schema primitives only; catalog behavior comes from active modules. */
const BASE_SCHEMA = StarterKit.configure({
  blockquote: false,
  bold: false,
  bulletList: false,
  code: false,
  codeBlock: false,
  dropcursor: false,
  // Gapcursor e trailingNode ficam ATIVOS: sem eles não há como posicionar o
  // cursor após uma tabela/bloco no fim do documento (cursor "preso").
  hardBreak: false,
  heading: false,
  horizontalRule: false,
  italic: false,
  link: false,
  listItem: false,
  listKeymap: false,
  orderedList: false,
  strike: false,
  underline: false,
  undoRedo: false,
});

interface ResolvedFeatures {
  readonly extensions: AnyExtension[];
  readonly floating: ComponentType<FeatureFloatingProps>[];
  readonly toolbarItems: ToolbarItemSpec[];
}

export function resolveFeatures(
  features: EditorProps["features"],
): ResolvedFeatures {
  const extensionByName = new Map<string, AnyExtension>();
  const toolbarItems: ToolbarItemSpec[] = [];
  const floating: ComponentType<FeatureFloatingProps>[] = [];

  for (const feature of REGISTRY) {
    const config = feature.resolveConfig(features?.[feature.key]);

    if (config !== null) {
      for (const extension of feature.extensions(config)) {
        if (!extensionByName.has(extension.name)) {
          extensionByName.set(extension.name, extension);
        }
      }
      toolbarItems.push(...feature.toolbarItems(config));

      if (feature.floating !== undefined) {
        floating.push(feature.floating);
      }
    }
  }

  return { extensions: [...extensionByName.values()], floating, toolbarItems };
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5] as const;

function ZoomControl({
  onZoom,
  zoom,
}: {
  readonly onZoom: (zoom: number) => void;
  readonly zoom: number;
}) {
  const index = ZOOM_LEVELS.indexOf(zoom as (typeof ZOOM_LEVELS)[number]);

  return (
    <Box sx={{ alignItems: "center", display: "flex", mr: 1 }}>
      <IconButton
        aria-label="Reduzir zoom"
        disabled={index <= 0}
        onClick={() => onZoom(ZOOM_LEVELS[Math.max(index - 1, 0)] ?? 1)}
        size="small"
        sx={{ borderRadius: 1 }}
      >
        <Icon icon="material-symbols:remove" />
      </IconButton>
      <Typography
        sx={{ minWidth: 40, textAlign: "center" }}
        variant="body2"
      >
        {Math.round(zoom * 100)}%
      </Typography>
      <IconButton
        aria-label="Aumentar zoom"
        disabled={index >= ZOOM_LEVELS.length - 1}
        onClick={() =>
          onZoom(ZOOM_LEVELS[Math.min(index + 1, ZOOM_LEVELS.length - 1)] ?? 1)
        }
        size="small"
        sx={{ borderRadius: 1 }}
      >
        <Icon icon="material-symbols:add" />
      </IconButton>
    </Box>
  );
}

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  {
    defaultValue,
    features,
    onChange,
    placeholder,
    readOnly = false,
    saveAs = "html",
    ui,
    value,
    variant = "standard",
  },
  ref,
) {
  const onChangeRef = useRef(onChange);
  const saveAsRef = useRef(saveAs);
  const contentRef = useRef<EditorContentValue | undefined>(
    value ?? defaultValue,
  );
  const [zoom, setZoom] = useState(1);
  const [pageSetup, setPageSetup] = useState<PageSetup>(DEFAULT_PAGE_SETUP);
  const [pageCount, setPageCount] = useState(1);
  onChangeRef.current = onChange;
  saveAsRef.current = saveAs;
  const isDocument = variant === "document";
  const isApostila = variant === "apostila";
  const isSheet = isDocument || isApostila;
  const pageMetrics = useMemo(
    () => computePageMetrics(pageSetup),
    [pageSetup],
  );
  const paginationContext = useRef<PaginationContext>({
    metrics: pageMetrics,
  });
  paginationContext.current.metrics = pageMetrics;
  paginationContext.current.onPageCount = setPageCount;

  const resolvedFeatures = useMemo(() => resolveFeatures(features), [features]);
  const toolbarItems = useMemo(
    () => applyUiOverrides(resolvedFeatures.toolbarItems, ui),
    [resolvedFeatures, ui],
  );
  const extensions = useMemo<AnyExtension[]>(() => {
    const nextExtensions = [BASE_SCHEMA, Markdown, ...resolvedFeatures.extensions];

    if (placeholder !== undefined) {
      nextExtensions.push(Placeholder.configure({ placeholder }));
    }

    if (isDocument) {
      nextExtensions.push(createPaginationExtension(paginationContext));
    }

    return nextExtensions;
  }, [isDocument, placeholder, resolvedFeatures]);

  const editor = useEditor(
    {
      ...(contentRef.current === undefined
        ? {}
        : { content: contentRef.current, contentType: saveAsRef.current }),
      editable: !readOnly,
      extensions,
      immediatelyRender: false,
      onUpdate: ({ editor: updatedEditor }) => {
        const value =
          saveAsRef.current === "markdown"
            ? updatedEditor.getMarkdown()
            : updatedEditor.getHTML();
        contentRef.current = value;
        onChangeRef.current?.(value);
      },
      shouldRerenderOnTransaction: true,
    },
    [extensions],
  );

  useEffect(() => {
    editor?.setEditable(!readOnly, false);
  }, [editor, readOnly]);

  useEffect(() => {
    // Formato/margens mudaram: zera as quebras para o plugin re-medir tudo.
    if (isDocument && editor !== null) {
      repaginate(editor.view);
    }
  }, [editor, isDocument, pageMetrics]);

  useEffect(() => {
    // Modo controlado: aplica mudanças EXTERNAS de value. O eco do próprio
    // onChange chega igual ao último conteúdo emitido (contentRef) e é
    // ignorado — sem isso, cada tecla resetaria documento e cursor.
    if (value === undefined || editor === null || value === contentRef.current) {
      return;
    }

    contentRef.current = value;
    editor.commands.setContent(value, {
      contentType: saveAsRef.current,
      emitUpdate: false,
    });
  }, [editor, value]);

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        editor?.commands.clearContent();
      },
      focus: () => {
        editor?.commands.focus();
      },
      getEditor: (): TiptapEditor | null => editor,
      getHTML: () => editor?.getHTML() ?? "",
      getJSON: () => editor?.getJSON() ?? null,
      getMarkdown: () => editor?.getMarkdown() ?? "",
    }),
    [editor],
  );

  return (
    <Paper
      sx={{
        bgcolor: isSheet ? "grey.100" : "background.paper",
        borderRadius: 3,
        overflow: "hidden",
      }}
      variant="outlined"
    >
      {!readOnly && editor && toolbarItems.length > 0 ? (
        <Box
          sx={
            isSheet
              ? {
                  bgcolor: "background.paper",
                  borderBottom: 1,
                  borderColor: "divider",
                  position: "sticky",
                  top: 0,
                  zIndex: 3,
                }
              : undefined
          }
        >
          <Toolbar
            editor={editor}
            items={toolbarItems}
            leading={
              isSheet ? (
                <>
                  <ZoomControl onZoom={setZoom} zoom={zoom} />
                  {isDocument ? (
                    <PageSetupControl
                      onChange={setPageSetup}
                      setup={pageSetup}
                    />
                  ) : null}
                </>
              ) : undefined
            }
          />
        </Box>
      ) : null}
      <Box
        sx={
          isSheet
            ? {
                bgcolor: "grey.100",
                maxHeight: "72vh",
                overflow: "auto",
                px: 2,
                py: 4,
              }
            : undefined
        }
      >
      <Box
        sx={{
          "& .tiptap": { minHeight: readOnly ? 0 : 160, outline: 0, p: 2 },
          "& .tiptap p.is-editor-empty:first-of-type::before": {
            color: "text.disabled",
            content: "attr(data-placeholder)",
            float: "left",
            height: 0,
            pointerEvents: "none",
          },
          "& .tiptap table": {
            borderCollapse: "collapse",
            tableLayout: "fixed",
            width: "100%",
          },
          "& .tiptap table td, & .tiptap table th": {
            border: 1,
            borderColor: "divider",
            p: 1,
            position: "relative",
            verticalAlign: "top",
          },
          "& .tiptap table th": {
            bgcolor: "action.hover",
            fontWeight: 600,
            textAlign: "left",
          },
          "& .tiptap table .selectedCell": {
            bgcolor: "action.selected",
          },
          // Handle DENTRO da célula (right: 0): fora dela (right: -2) o wrapper
          // com overflow ganha scrollbar no hover e o clique de resize falha.
          "& .tiptap .tableWrapper": { overflowX: "auto", py: 0.5 },
          "& .tiptap .column-resize-handle": {
            bgcolor: "primary.main",
            bottom: 0,
            pointerEvents: "none",
            position: "absolute",
            right: 0,
            top: 0,
            width: "3px",
            zIndex: 2,
          },
          "& .tiptap.resize-cursor": { cursor: "col-resize" },
          // Colunas estilo jornal: filhos não quebram no meio entre colunas.
          '& .tiptap [data-type="columns"] > *': { breakInside: "avoid" },
          ...(isDocument
            ? {
                minHeight:
                  pageCount * (pageMetrics.heightPx + PAGE_GAP_PX) -
                  PAGE_GAP_PX,
                mx: "auto",
                position: "relative",
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                width: pageMetrics.widthPx,
                "& .editor-page-spacer": { pointerEvents: "none" },
                "& .tiptap": {
                  minHeight: pageMetrics.heightPx,
                  outline: 0,
                  paddingBottom: `${pageMetrics.paddingPx.bottom}px`,
                  paddingLeft: `${pageMetrics.paddingPx.left}px`,
                  paddingRight: `${pageMetrics.paddingPx.right}px`,
                  paddingTop: `${pageMetrics.paddingPx.top}px`,
                  position: "relative",
                  zIndex: 1,
                },
              }
            : {}),
          ...(isApostila
            ? {
                bgcolor: "background.paper",
                boxShadow: 3,
                mx: "auto",
                position: "relative",
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                width: APOSTILA_SHEET.widthPx,
                "& .tiptap": {
                  fontSize: `${APOSTILA_SHEET.fontSizePx}px`,
                  lineHeight: APOSTILA_SHEET.lineHeight,
                  minHeight: 480,
                  outline: 0,
                  paddingBottom: `${APOSTILA_SHEET.paddingPx.bottom}px`,
                  paddingLeft: `${APOSTILA_SHEET.paddingPx.left}px`,
                  paddingRight: `${APOSTILA_SHEET.paddingPx.right}px`,
                  paddingTop: `${APOSTILA_SHEET.paddingPx.top}px`,
                },
              }
            : {}),
        }}
      >
        {isDocument
          ? Array.from({ length: pageCount }, (_item, index) => (
              <Box
                aria-hidden
                key={index}
                sx={{
                  bgcolor: pageSetup.background ?? "background.paper",
                  boxShadow: 3,
                  height: pageMetrics.heightPx,
                  left: 0,
                  position: "absolute",
                  right: 0,
                  top: index * (pageMetrics.heightPx + PAGE_GAP_PX),
                }}
              />
            ))
          : null}
        <EditorContent editor={editor} />
      </Box>
      </Box>
      {!readOnly && editor
        ? resolvedFeatures.floating.map((Floating, index) => (
            <Floating editor={editor} key={index} />
          ))
        : null}
    </Paper>
  );
});
