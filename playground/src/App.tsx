import {
  ApostilaEditor,
  DocumentEditor,
  Editor,
  type EditorFeatures,
  type ImageFeatureConfig,
} from "@joshualevy029/tiptap-editor";
import { SAMPLE_APOSTILA_HTML } from "./sampleApostila";
import {
  Box,
  Container,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useState } from "react";

const MINIMAL_FEATURES = {
  textType: false,
  bold: true,
  italic: true,
  bulletList: true,
  orderedList: true,
  indent: false,
  image: false,
  table: false,
  undoRedo: false,
  textAlign: false,
  backgroundColor: false,
  textColor: false,
  fontFamily: false,
  fontSize: false,
  highlight: false,
  specialCharacters: false,
  strike: false,
  underline: false,
  subscript: false,
  superscript: false,
  sourceCode: false,
  math: false,
  chemistry: false,
} satisfies EditorFeatures;

const demoUpload: NonNullable<ImageFeatureConfig["onUpload"]> = async (
  file,
) => {
  // Simula a latência de uma API e devolve um src real (base64), como faria
  // um backend devolvendo a URL final do arquivo hospedado.
  await new Promise<void>((resolve) => window.setTimeout(resolve, 1_000));
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
};

const COMPLETE_FEATURES = {
  image: { onUpload: demoUpload },
} satisfies EditorFeatures;

type DemoKey = "complete" | "docx" | "apostila" | "minimal" | "markdown";

const DEMOS: ReadonlyArray<{ key: DemoKey; label: string }> = [
  { key: "complete", label: "Editor completo" },
  { key: "docx", label: "Docx editor" },
  { key: "apostila", label: "Apostila editor" },
  { key: "minimal", label: "Editor minimalista" },
  { key: "markdown", label: "Markdown editor" },
];

const pillGroupSx = {
  bgcolor: "action.hover",
  borderRadius: 99,
  p: 0.5,
  width: "fit-content",
  "& .MuiToggleButton-root": {
    border: 0,
    borderRadius: 99,
    color: "text.secondary",
    fontWeight: 600,
    px: 2.5,
    py: 0.75,
    textTransform: "none",
    "&.Mui-selected": {
      bgcolor: "background.paper",
      boxShadow: 1,
      color: "text.primary",
      "&:hover": { bgcolor: "background.paper" },
    },
  },
} as const;

const stateSx = {
  bgcolor: "action.hover",
  borderRadius: 2,
  fontSize: "0.75rem",
  maxHeight: 160,
  overflow: "auto",
  p: 1.5,
  whiteSpace: "pre-wrap",
} as const;

export function App() {
  const [demo, setDemo] = useState<DemoKey>("complete");
  const [html, setHtml] = useState("");
  const [markdown, setMarkdown] = useState("");

  return (
    <Box
      component="main"
      sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Typography component="h1" variant="h3">
            Editor Tiptap
          </Typography>
          <Typography color="text.secondary">
            Playground conectado à API pública da biblioteca via alias para src.
          </Typography>

          <ToggleButtonGroup
            aria-label="Tipo de editor"
            exclusive
            onChange={(_event, value: DemoKey | null) => {
              if (value !== null) {
                setDemo(value);
              }
            }}
            sx={pillGroupSx}
            value={demo}
          >
            {DEMOS.map((item) => (
              <ToggleButton key={item.key} value={item.key}>
                {item.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Demos ficam montadas (display none) para não perder o conteúdo digitado ao alternar. */}
          <Box sx={{ display: demo === "complete" ? "block" : "none" }}>
            <Paper component="section" sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                <Typography color="text.secondary" variant="body2">
                  Todas as features ativas. O upload demonstra um callback
                  customizado que resolve o src após um segundo.
                </Typography>
                <Editor
                  features={COMPLETE_FEATURES}
                  onChange={setHtml}
                  placeholder="Experimente todas as features…"
                />
                <Typography color="text.secondary" variant="body2">
                  State (HTML emitido pelo onChange, pronto para persistir):
                </Typography>
                <Box component="pre" sx={stateSx}>
                  {html === "" ? "(vazio)" : html}
                </Box>
              </Stack>
            </Paper>
          </Box>

          <Box sx={{ display: demo === "docx" ? "block" : "none" }}>
            <Stack spacing={2}>
              <Typography color="text.secondary" variant="body2">
                DocumentEditor: folhas paginadas (A4 por padrão) com zoom e
                configuração de página — formato, orientação, margens e cor.
              </Typography>
              <DocumentEditor placeholder="Escreva um documento longo para ver a quebra de páginas…" />
            </Stack>
          </Box>

          <Box sx={{ display: demo === "apostila" ? "block" : "none" }}>
            <Stack spacing={2}>
              <Typography color="text.secondary" variant="body2">
                ApostilaEditor: folha única no formato de página de
                apostila (736px, tipografia 16px/1.6), carregada com uma
                página de exemplo em duas colunas.
              </Typography>
              <ApostilaEditor defaultValue={SAMPLE_APOSTILA_HTML} />
            </Stack>
          </Box>

          <Box sx={{ display: demo === "minimal" ? "block" : "none" }}>
            <Paper component="section" sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                <Typography color="text.secondary" variant="body2">
                  Somente negrito, itálico e listas ordenadas/não ordenadas
                  estão registradas.
                </Typography>
                <Editor
                  features={MINIMAL_FEATURES}
                  placeholder="Toolbar mínima…"
                />
              </Stack>
            </Paper>
          </Box>

          <Box sx={{ display: demo === "markdown" ? "block" : "none" }}>
            <Paper component="section" sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                <Typography color="text.secondary" variant="body2">
                  Mesmo componente com saveAs=&quot;markdown&quot;: o onChange
                  emite Markdown e o defaultValue também é interpretado como
                  Markdown.
                </Typography>
                <Editor
                  defaultValue={
                    "# Título de exemplo\n\nTexto com **negrito** e *itálico*.\n\n- Item um\n- Item dois"
                  }
                  onChange={setMarkdown}
                  placeholder="Escreva em rich-text, salve em Markdown…"
                  saveAs="markdown"
                />
                <Typography color="text.secondary" variant="body2">
                  State (Markdown emitido pelo onChange):
                </Typography>
                <Box component="pre" sx={stateSx}>
                  {markdown === "" ? "(vazio — digite algo acima)" : markdown}
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
