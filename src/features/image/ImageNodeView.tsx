import { Icon } from "@iconify/react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputBase,
  Paper,
  Popover,
  Popper,
  TextField,
  Tooltip,
} from "@mui/material";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { clampImageWidth, parseImageAlign, type ImageAlign } from "./imageMarkup";

type Corner = "tl" | "tr" | "bl" | "br";

const CORNERS: readonly Corner[] = ["tl", "tr", "bl", "br"];

const cornerSx: Record<Corner, Record<string, unknown>> = {
  tl: { cursor: "nwse-resize", left: -6, top: -6 },
  tr: { cursor: "nesw-resize", right: -6, top: -6 },
  bl: { cursor: "nesw-resize", bottom: -6, left: -6 },
  br: { cursor: "nwse-resize", bottom: -6, right: -6 },
};

const ALIGNMENTS: ReadonlyArray<{ icon: string; value: ImageAlign }> = [
  { icon: "material-symbols:format-align-left", value: "left" },
  { icon: "material-symbols:format-align-center", value: "center" },
  { icon: "material-symbols:format-align-right", value: "right" },
];

const ALIGN_LABELS: Record<ImageAlign, string> = {
  center: "Centralizar imagem",
  left: "Alinhar imagem à esquerda",
  right: "Alinhar imagem à direita",
};

export function ImageNodeView({
  editor,
  node,
  selected,
  updateAttributes,
}: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [wrapperElement, setWrapperElement] =
    useState<HTMLDivElement | null>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [altAnchor, setAltAnchor] = useState<HTMLElement | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  const src = typeof node.attrs.src === "string" ? node.attrs.src : "";

  useEffect(() => {
    setLoadFailed(false);
  }, [src]);

  const align = parseImageAlign(node.attrs.align);
  const caption =
    typeof node.attrs.caption === "string" ? node.attrs.caption : null;
  const storedWidth =
    typeof node.attrs.width === "number" ? node.attrs.width : null;
  const width = dragWidth ?? storedWidth;
  const active = selected && editor.isEditable;

  const startResize = (corner: Corner) => (event: ReactPointerEvent) => {
    const img = imgRef.current;

    if (img === null) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = img.offsetWidth;
    const fromLeft = corner === "tl" || corner === "bl";
    let finalWidth = startWidth;

    const onMove = (move: globalThis.PointerEvent) => {
      const delta = (move.clientX - startX) * (fromLeft ? -1 : 1);
      finalWidth = clampImageWidth(startWidth + delta);
      setDragWidth(finalWidth);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDragWidth(null);
      updateAttributes({ width: finalWidth });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const openAlt = (event: ReactPointerEvent<HTMLElement> | { currentTarget: HTMLElement }) => {
    setAltDraft(typeof node.attrs.alt === "string" ? node.attrs.alt : "");
    setAltAnchor(event.currentTarget);
  };

  const saveAlt = () => {
    updateAttributes({ alt: altDraft.length === 0 ? null : altDraft });
    setAltAnchor(null);
  };

  if (node.attrs.uploading === true) {
    return (
      <NodeViewWrapper>
        <Box
          aria-label="Carregando imagem"
          role="status"
          sx={{
            alignItems: "center",
            bgcolor: "action.hover",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            display: "flex",
            justifyContent: "center",
            minHeight: 96,
            width: "100%",
          }}
        >
          <CircularProgress size={28} />
        </Box>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <Box
        ref={setWrapperElement}
        sx={{
          maxWidth: "100%",
          ml: align === "left" ? 0 : "auto",
          mr: align === "right" ? 0 : "auto",
          position: "relative",
          width: "fit-content",
        }}
      >
        {loadFailed || src.length === 0 ? (
          <Box
            data-drag-handle
            sx={{
              alignItems: "center",
              border: "2px dashed",
              borderColor: active ? "primary.main" : "divider",
              borderRadius: 1,
              color: "text.disabled",
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              justifyContent: "center",
              minHeight: 100,
              p: 2,
              width: width === null ? 240 : `${width}px`,
            }}
          >
            <Icon fontSize={28} icon="material-symbols:broken-image-outline" />
            <Box component="span" sx={{ fontSize: "0.75rem" }}>
              Imagem indisponível
            </Box>
          </Box>
        ) : (
          <Box
            alt={typeof node.attrs.alt === "string" ? node.attrs.alt : ""}
            component="img"
            data-drag-handle
            draggable
            onError={() => setLoadFailed(true)}
            ref={imgRef}
            src={src}
            sx={{
              display: "block",
              height: "auto",
              maxWidth: "100%",
              minHeight: 24,
              minWidth: 48,
              outline: active ? 2 : 0,
              outlineColor: "primary.main",
              outlineStyle: active ? "solid" : "none",
              width: width === null ? undefined : `${width}px`,
            }}
            title={
              typeof node.attrs.title === "string"
                ? node.attrs.title
                : undefined
            }
          />
        )}

        {active && !loadFailed && src.length > 0
          ? CORNERS.map((corner) => (
              <Box
                aria-label={`Redimensionar imagem (${corner})`}
                key={corner}
                onPointerDown={startResize(corner)}
                sx={{
                  bgcolor: "primary.main",
                  border: 2,
                  borderColor: "background.paper",
                  borderRadius: 0.5,
                  height: 12,
                  position: "absolute",
                  width: 12,
                  zIndex: 3,
                  ...cornerSx[corner],
                }}
              />
            ))
          : null}

        {caption !== null ? (
          <InputBase
            fullWidth
            inputProps={{ "aria-label": "Legenda da imagem" }}
            multiline
            onChange={(event) =>
              updateAttributes({ caption: event.target.value })
            }
            placeholder="Legenda…"
            readOnly={!editor.isEditable}
            sx={{
              color: "text.secondary",
              fontSize: "0.85rem",
              justifyContent: "center",
              mt: 0.5,
              "& .MuiInputBase-input": { textAlign: "center" },
            }}
            value={caption}
          />
        ) : null}
      </Box>

      {wrapperElement !== null ? (
        <Popper
          anchorEl={wrapperElement}
          open={active}
          placement="top"
          sx={{ zIndex: (theme) => theme.zIndex.tooltip }}
        >
          <Paper
            elevation={3}
            sx={{
              borderRadius: 2,
              display: "flex",
              gap: 0.25,
              mb: 1,
              p: 0.5,
            }}
          >
            <Tooltip title="Texto alternativo (alt)">
              <Button
                aria-label="Editar texto alternativo"
                onClick={(event) => openAlt(event)}
                size="small"
                sx={{
                  border: 1,
                  borderColor:
                    typeof node.attrs.alt === "string" &&
                    node.attrs.alt.length > 0
                      ? "primary.main"
                      : "divider",
                  borderRadius: 1,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  minWidth: 0,
                  px: 0.75,
                }}
              >
                ALT
              </Button>
            </Tooltip>
            {ALIGNMENTS.map((item) => (
              <Tooltip key={item.value} title={ALIGN_LABELS[item.value]}>
                <IconButton
                  aria-label={ALIGN_LABELS[item.value]}
                  color={align === item.value ? "primary" : "default"}
                  onClick={() => updateAttributes({ align: item.value })}
                  size="small"
                  sx={{ borderRadius: 1 }}
                >
                  <Icon icon={item.icon} />
                </IconButton>
              </Tooltip>
            ))}
            <Tooltip
              title={
                caption === null ? "Adicionar legenda" : "Remover legenda"
              }
            >
              <IconButton
                aria-label={
                  caption === null ? "Adicionar legenda" : "Remover legenda"
                }
                color={caption === null ? "default" : "primary"}
                onClick={() =>
                  updateAttributes({ caption: caption === null ? "" : null })
                }
                size="small"
                sx={{ borderRadius: 1 }}
              >
                <Icon icon="material-symbols:closed-caption-outline" />
              </IconButton>
            </Tooltip>
          </Paper>
        </Popper>
      ) : null}

      <Popover
        anchorEl={altAnchor}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        onClose={saveAlt}
        open={altAnchor !== null}
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1.5 } } }}
      >
        <TextField
          autoFocus
          label="Texto alternativo"
          onChange={(event) => setAltDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              saveAlt();
            }
          }}
          size="small"
          value={altDraft}
        />
      </Popover>
    </NodeViewWrapper>
  );
}
