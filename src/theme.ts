import { createTheme, type Theme, type ThemeOptions } from "@mui/material";

/**
 * Paleta grafite sugerida para o editor (SPEC 5.2). O componente sempre herda
 * o ThemeProvider do host; este tema é opcional, para hosts sem tema próprio.
 */
export const EDITOR_THEME_OPTIONS: ThemeOptions = {
  palette: {
    primary: {
      contrastText: "#ffffff",
      dark: "#1b1f24",
      light: "#57606a",
      main: "#24292f",
    },
  },
};

export function createEditorTheme(options: ThemeOptions = {}): Theme {
  return createTheme({ ...EDITOR_THEME_OPTIONS, ...options });
}
