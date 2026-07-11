import { Icon } from "@iconify/react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputBase,
  Stack,
  Typography,
} from "@mui/material";
import katex from "katex";
import "katex/contrib/mhchem";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ToolbarDialogProps } from "../types";
import { ROUNDED_PAPER_SLOT_PROPS } from "../../ui";
import {
  commitChemistryFormula,
  getChemistryUi,
  getSelectedChemistryNode,
  insertSnippet,
  joinCeWrapper,
  splitCeWrapper,
  type ChemistryNodeTarget,
  type ChemistrySelectionRange,
} from "./helpers";

interface PreviewResult {
  readonly error?: string;
  readonly html?: string;
}

function renderPreview(latex: string): PreviewResult {
  try {
    return {
      html: katex.renderToString(latex, {
        displayMode: true,
        throwOnError: true,
      }),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Sintaxe mhchem inválida.",
    };
  }
}

const categoryLabelSx = {
  color: "text.disabled",
  display: "block",
  fontFamily: "monospace",
  letterSpacing: 1.5,
  mb: 0.75,
  textTransform: "uppercase",
} as const;

const chipSx = {
  bgcolor: "background.paper",
  border: 1,
  borderColor: "divider",
  borderRadius: 2.5,
  color: "text.primary",
  minWidth: 0,
  px: 1.25,
  py: 0.5,
  textTransform: "none",
} as const;

export default function ChemistryDialog({
  editor,
  onClose,
  open,
}: ToolbarDialogProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [inner, setInner] = useState("");
  const [wrapped, setWrapped] = useState(true);
  const [target, setTarget] = useState<ChemistryNodeTarget | null>(null);
  const [selection, setSelection] = useState<ChemistrySelectionRange>({
    from: editor.state.selection.from,
    to: editor.state.selection.to,
  });
  const [commitError, setCommitError] = useState<string>();
  const ui = useMemo(() => getChemistryUi(editor), [editor]);

  const latex = joinCeWrapper({ inner, wrapped });
  const preview = useMemo(() => renderPreview(latex), [latex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const selected = getSelectedChemistryNode(editor);
    const source = splitCeWrapper(selected?.latex ?? "\\ce{}");
    setSelection({
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    });
    setTarget(selected);
    setInner(source.inner);
    setWrapped(source.wrapped);
    setCommitError(undefined);

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      const cursor = source.inner.length;
      inputRef.current?.setSelectionRange(cursor, cursor);
    });

    return () => window.clearTimeout(timer);
  }, [editor, open]);

  const addSnippet = (snippet: string) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? inner.length;
    const end = input?.selectionEnd ?? start;
    const insertion = insertSnippet(inner, snippet, start, end);

    setInner(insertion.value);
    setCommitError(undefined);
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(insertion.cursor, insertion.cursor);
    });
  };

  const confirm = () => {
    if (!commitChemistryFormula(editor, latex, target, selection)) {
      setCommitError(
        target === null
          ? "Não foi possível inserir a fórmula na seleção atual."
          : "A fórmula original mudou enquanto o diálogo estava aberto.",
      );
      return;
    }

    onClose();
  };

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      open={open}
      slotProps={ROUNDED_PAPER_SLOT_PROPS}
    >
      <DialogTitle sx={{ fontWeight: 600, pr: 6 }}>
        {target === null ? "Inserir fórmula química" : "Editar fórmula química"}
        <IconButton
          aria-label="Fechar"
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <Icon icon="material-symbols:close" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column-reverse", md: "row" },
            gap: 3,
          }}
        >
          <Box
            component="aside"
            sx={{
              bgcolor: "action.hover",
              borderRadius: 3,
              flexShrink: 0,
              maxHeight: { md: 480 },
              overflowY: "auto",
              p: 2,
              width: { md: 340 },
            }}
          >
            <Stack spacing={2}>
              {ui.groups.map((group) => (
                <Box key={group.label}>
                  <Typography sx={categoryLabelSx} variant="caption">
                    {group.label}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {group.items.map((item, index) => (
                      <Button
                        aria-label={`Inserir ${item.label}`}
                        key={`${item.label}-${index}`}
                        onClick={() => addSnippet(item.value)}
                        onMouseDown={(event) => event.preventDefault()}
                        size="small"
                        sx={chipSx}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </Box>
                </Box>
              ))}

              {ui.templates.length > 0 ? (
                <Box>
                  <Typography sx={categoryLabelSx} variant="caption">
                    Modelos prontos
                  </Typography>
                  <Stack spacing={1}>
                    {ui.templates.map((template, index) => (
                      <ButtonBase
                        key={`${template.label}-${index}`}
                        onClick={() => addSnippet(template.value)}
                        onMouseDown={(event) => event.preventDefault()}
                        sx={{
                          ...chipSx,
                          alignItems: "flex-start",
                          display: "flex",
                          flexDirection: "column",
                          p: 1.25,
                          textAlign: "left",
                          width: "100%",
                        }}
                      >
                        <Typography sx={{ fontWeight: 600 }} variant="body2">
                          {template.label}
                        </Typography>
                        <Typography
                          sx={{
                            color: "text.disabled",
                            fontFamily: "monospace",
                          }}
                          variant="caption"
                        >
                          {template.value}
                        </Typography>
                      </ButtonBase>
                    ))}
                  </Stack>
                </Box>
              ) : null}
            </Stack>
          </Box>

          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Box
                aria-live="polite"
                sx={{
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "center",
                  minHeight: 160,
                  overflowX: "auto",
                  p: 2,
                }}
              >
                {preview.error === undefined ? (
                  <Box
                    aria-label="Pré-visualização da fórmula"
                    dangerouslySetInnerHTML={{ __html: preview.html ?? "" }}
                    sx={{ fontSize: "1.35rem" }}
                  />
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    {inner.length === 0
                      ? "Digite a equação abaixo ou use a paleta ao lado"
                      : "Sintaxe não renderizável — o código será preservado."}
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  alignItems: "flex-start",
                  bgcolor: "action.hover",
                  borderTop: "1px dashed",
                  borderTopColor: "divider",
                  display: "flex",
                  gap: 1,
                  px: 2,
                  py: 1.5,
                }}
              >
                {wrapped ? (
                  <Typography
                    aria-hidden
                    sx={{
                      color: "text.disabled",
                      fontFamily: "monospace",
                      pt: 0.25,
                    }}
                    variant="caption"
                  >
                    {"\\ce{"}
                  </Typography>
                ) : null}
                <InputBase
                  fullWidth
                  inputProps={{ "aria-label": "Código mhchem" }}
                  inputRef={inputRef}
                  multiline
                  onChange={(event) => {
                    setInner(event.target.value);
                    setCommitError(undefined);
                  }}
                  sx={{ fontFamily: "monospace", fontSize: "0.9rem", p: 0 }}
                  value={inner}
                />
                {wrapped ? (
                  <Typography
                    aria-hidden
                    sx={{
                      color: "text.disabled",
                      fontFamily: "monospace",
                      pt: 0.25,
                    }}
                    variant="caption"
                  >
                    {"}"}
                  </Typography>
                ) : null}
              </Box>
            </Box>

            {commitError ? <Alert severity="error">{commitError}</Alert> : null}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          disabled={inner.trim().length === 0}
          onClick={confirm}
          sx={{ borderRadius: 2, px: 3, textTransform: "none" }}
          variant="contained"
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
