import { describe, expect, it } from "vitest";
import { createEditorTheme } from "../src/theme";

describe("tema grafite sugerido (SPEC 5.2)", () => {
  it("usa grafite como cor primária, não o azul default do MUI", () => {
    const theme = createEditorTheme();

    expect(theme.palette.primary.main).toBe("#24292f");
  });

  it("permite sobrescrever opções mantendo a base", () => {
    const theme = createEditorTheme({ shape: { borderRadius: 8 } });

    expect(theme.shape.borderRadius).toBe(8);
    expect(theme.palette.primary.main).toBe("#24292f");
  });
});
