import { Icon } from "@iconify/react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputBase,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import type { ToolbarDialogProps } from "../types";
import { ROUNDED_PAPER_SLOT_PROPS } from "../../ui";
import {
  commitMathDialog,
  createMathDialogSession,
  isFaithfulMathLiveRoundTrip,
  readMathUiStorage,
  renderLatexPreview,
  type MathNodeKind,
} from "./helpers";
import {
  getMathfield,
  getMathVirtualKeyboard,
  type MathfieldLike,
} from "./mathlive";

const pillGroupSx = {
  bgcolor: "action.hover",
  borderRadius: 99,
  p: 0.5,
  "& .MuiToggleButton-root": {
    border: 0,
    borderRadius: 99,
    color: "text.secondary",
    px: 2,
    py: 0.5,
    textTransform: "none",
    "&.Mui-selected": {
      bgcolor: "text.primary",
      color: "background.paper",
      "&:hover": { bgcolor: "text.primary" },
    },
  },
} as const;

export default function MathDialog({
  editor,
  onClose,
  open,
}: ToolbarDialogProps) {
  const [session] = useState(() => createMathDialogSession(editor));
  const [kind, setKind] = useState<MathNodeKind>(
    session.target?.kind ?? "inlineMath",
  );
  const [latex, setLatex] = useState(session.originalLatex);
  const [mathLiveReady, setMathLiveReady] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [roundTripWarning, setRoundTripWarning] = useState(false);
  const [commitError, setCommitError] = useState(false);
  const [symbolsOpen, setSymbolsOpen] = useState(false);
  const fieldElementRef = useRef<HTMLElement | null>(null);
  const syncingFieldRef = useRef(false);
  const uiConfig = useMemo(() => readMathUiStorage(editor), [editor]);

  const visualEnabled =
    !roundTripWarning && loadError === undefined && mathLiveReady;
  const preview = useMemo(
    () => renderLatexPreview(latex, kind === "blockMath"),
    [kind, latex],
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let active = true;
    let field: MathfieldLike | null = null;
    const previousKeyboardZIndex =
      document.body.style.getPropertyValue("--keyboard-zindex");
    document.body.style.setProperty("--keyboard-zindex", "1400");

    const handleInput = () => {
      if (field === null || syncingFieldRef.current) {
        return;
      }

      setLatex(field.getValue("latex"));
      setCommitError(false);
    };

    void import("mathlive")
      .then(() => {
        if (!active) {
          return;
        }

        field = getMathfield(fieldElementRef.current);

        if (field === null) {
          throw new Error("O campo visual não pôde ser inicializado.");
        }

        field.mathVirtualKeyboardPolicy = "manual";
        field.defaultMode =
          (session.target?.kind ?? "inlineMath") === "blockMath"
            ? "math"
            : "inline-math";
        field.value = session.originalLatex;
        const serialized = field.getValue("latex");
        const unsafeRoundTrip =
          session.target !== null &&
          !isFaithfulMathLiveRoundTrip(session.originalLatex, serialized);

        if (unsafeRoundTrip) {
          setRoundTripWarning(true);
        }

        field.addEventListener("input", handleInput);
        const keyboard = getMathVirtualKeyboard();

        if (keyboard !== undefined) {
          keyboard.layouts = uiConfig.keyboardLayouts;
        }

        if (uiConfig.templates.length > 0) {
          const nativeItems = field.menuItems;
          const templateMenu = {
            label: "Modelos personalizados",
            submenu: uiConfig.templates.map((template) => ({
              label: template,
              onMenuSelect: () => {
                field?.insert(template);
                // devolve o foco ao campo para digitar direto no placeholder
                field?.focus();
                handleInput();
              },
            })),
          };

          (field as { menuItems: readonly unknown[] }).menuItems = [
            templateMenu,
            { type: "divider" },
            ...nativeItems,
          ];
        }

        setMathLiveReady(true);

        if (!unsafeRoundTrip) {
          field.focus();
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o MathLive.",
        );
      });

    return () => {
      active = false;
      field?.removeEventListener("input", handleInput);
      getMathVirtualKeyboard()?.hide();

      if (previousKeyboardZIndex.length === 0) {
        document.body.style.removeProperty("--keyboard-zindex");
      } else {
        document.body.style.setProperty(
          "--keyboard-zindex",
          previousKeyboardZIndex,
        );
      }
    };
  }, [open, session, uiConfig]);

  const handleKindChange = (
    _event: SyntheticEvent,
    nextKind: MathNodeKind | null,
  ) => {
    if (nextKind === null || session.target !== null) {
      return;
    }

    setKind(nextKind);
    const field = getMathfield(fieldElementRef.current);

    if (field !== null) {
      // Reflete o tipo no campo visual: bloco usa displaystyle (math),
      // linha usa textstyle (inline-math). Re-atribui o valor para o
      // MathLive re-renderizar já no novo modo, sem tocar no estado latex.
      syncingFieldRef.current = true;
      field.defaultMode = nextKind === "blockMath" ? "math" : "inline-math";
      field.value = field.getValue("latex");
      syncingFieldRef.current = false;
    }
  };

  const handleRawChange = (value: string) => {
    setLatex(value);
    setCommitError(false);

    if (!visualEnabled) {
      return;
    }

    const field = getMathfield(fieldElementRef.current);

    if (field !== null) {
      // Espelha no campo visual sem re-serializar de volta (P3: o texto
      // digitado permanece a fonte da verdade, byte a byte).
      syncingFieldRef.current = true;
      field.value = value;
      syncingFieldRef.current = false;
    }
  };

  const toggleSymbols = () => {
    const keyboard = getMathVirtualKeyboard();

    if (keyboard === undefined) {
      return;
    }

    if (symbolsOpen) {
      keyboard.hide();
    } else {
      getMathfield(fieldElementRef.current)?.focus();
      keyboard.show();
    }

    setSymbolsOpen(!symbolsOpen);
  };

  const handleCancel = () => {
    getMathVirtualKeyboard()?.hide();
    onClose();
  };

  const handleConfirm = () => {
    const result = commitMathDialog(editor, session, kind, latex);

    if (result === "stale") {
      setCommitError(true);
      return;
    }

    getMathVirtualKeyboard()?.hide();
    onClose();
  };

  return (
    <Dialog
      // O <math-field> usa shadow DOM e o teclado virtual/menu do MathLive
      // montam fora do Dialog; o focus trap do MUI roubaria o foco deles e
      // as teclas nunca chegariam ao campo (placeholder "ineditável").
      disableEnforceFocus
      fullWidth
      maxWidth="md"
      onClose={handleCancel}
      open={open}
      slotProps={ROUNDED_PAPER_SLOT_PROPS}
    >
      <DialogTitle sx={{ fontWeight: 600, pr: 6 }}>
        {session.target === null
          ? "Inserir fórmula matemática"
          : "Editar fórmula matemática"}
        <IconButton
          aria-label="Fechar"
          onClick={handleCancel}
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <Icon icon="material-symbols:close" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Box sx={{ display: "flex" }}>
            <ToggleButtonGroup
              aria-label="Tipo da fórmula"
              disabled={session.target !== null}
              exclusive
              onChange={handleKindChange}
              size="small"
              sx={pillGroupSx}
              value={kind}
            >
              <ToggleButton value="inlineMath">Em linha</ToggleButton>
              <ToggleButton value="blockMath">Em bloco</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {roundTripWarning ? (
            <Alert severity="warning">
              Edição visual indisponível para esta fórmula sem risco de
              alteração. Edite o código LaTeX abaixo para preservar o conteúdo
              exatamente.
            </Alert>
          ) : null}
          {loadError !== undefined ? (
            <Alert severity="warning">{loadError}</Alert>
          ) : null}
          {commitError ? (
            <Alert severity="error">
              A fórmula original mudou ou não está mais na mesma posição. Nenhum
              node foi criado ou movido.
            </Alert>
          ) : null}

          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                alignItems: "center",
                display: visualEnabled ? "flex" : "none",
                justifyContent: "center",
                minHeight: 140,
                p: 2,
              }}
            >
              <Box
                aria-label="Editor visual de fórmula"
                component="math-field"
                ref={fieldElementRef}
                sx={{
                  border: 0,
                  fontSize: "1.5rem",
                  outline: "none",
                  width: "100%",
                  "&::part(container)": { justifyContent: "center" },
                }}
              />
            </Box>

            {!visualEnabled ? (
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "center",
                  minHeight: 140,
                  p: 2,
                }}
              >
                {!mathLiveReady &&
                loadError === undefined &&
                !roundTripWarning ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                  >
                    <CircularProgress size={20} />
                    <Typography variant="body2">
                      Carregando editor visual…
                    </Typography>
                  </Stack>
                ) : preview.error === null && preview.html !== null ? (
                  <Box
                    aria-label="Preview da fórmula"
                    dangerouslySetInnerHTML={{ __html: preview.html }}
                    sx={{ fontSize: "1.35rem" }}
                  />
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    {latex.length === 0
                      ? "Digite o código LaTeX abaixo"
                      : "LaTeX não renderizável — o código será preservado."}
                  </Typography>
                )}
              </Box>
            ) : null}

            <Box
              sx={{
                alignItems: "center",
                bgcolor: "action.hover",
                borderTop: "1px dashed",
                borderTopColor: "divider",
                display: "flex",
                gap: 1.5,
                px: 2,
                py: 1.5,
              }}
            >
              <Typography
                aria-label="LaTeX"
                sx={{
                  color: "text.disabled",
                  fontFamily: "Georgia, serif",
                  fontSize: "1.1rem",
                  fontStyle: "italic",
                  lineHeight: 1,
                }}
              >
                λ
              </Typography>
              <InputBase
                fullWidth
                inputProps={{ "aria-label": "Código LaTeX" }}
                multiline
                onChange={(event) => handleRawChange(event.target.value)}
                sx={{ fontFamily: "monospace", fontSize: "0.9rem" }}
                value={latex}
              />
            </Box>
          </Box>

          {preview.error !== null && latex.length > 0 ? (
            <Alert severity="error">
              LaTeX não renderizável pelo KaTeX. O código será preservado e
              exibido cru no documento.
            </Alert>
          ) : null}

          {visualEnabled ? (
            <Button
              onClick={toggleSymbols}
              size="small"
              startIcon={
                <Icon
                  icon={
                    symbolsOpen
                      ? "material-symbols:arrow-drop-down"
                      : "material-symbols:arrow-right"
                  }
                />
              }
              sx={{
                alignSelf: "flex-start",
                color: "primary.main",
                textTransform: "none",
              }}
            >
              Símbolos e estruturas
            </Button>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          color="inherit"
          onClick={handleCancel}
          sx={{ textTransform: "none" }}
        >
          Cancelar
        </Button>
        <Button
          disabled={latex.length === 0}
          onClick={handleConfirm}
          sx={{ borderRadius: 2, px: 3, textTransform: "none" }}
          variant="contained"
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
