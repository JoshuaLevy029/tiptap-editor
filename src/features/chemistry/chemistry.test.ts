import { describe, expect, it } from "vitest";
import { chemistryFeature } from "./index";
import {
  DEFAULT_CHEMISTRY_GROUPS,
  DEFAULT_CHEMISTRY_TEMPLATES,
  insertSnippet,
  joinCeWrapper,
  splitCeWrapper,
} from "./helpers";

describe("chemistryFeature", () => {
  it("resolves false to null and true to defaults", () => {
    expect(chemistryFeature.resolveConfig(false)).toBeNull();

    const config = chemistryFeature.resolveConfig(true);
    expect(config?.groups).toEqual(DEFAULT_CHEMISTRY_GROUPS);
    expect(config?.templates).toEqual(DEFAULT_CHEMISTRY_TEMPLATES);
  });

  it("converts a legacy flat palette into a single group", () => {
    const palette = [{ label: "Reação", value: "->" }];
    const config = chemistryFeature.resolveConfig({ palette });

    expect(config?.groups).toEqual([
      { items: [{ label: "Reação", value: "->" }], label: "Paleta" },
    ]);
  });

  it("keeps configured groups isolated from caller mutation", () => {
    const groups = [
      { items: [{ label: "Reação", value: "->" }], label: "Setas" },
    ];
    const config = chemistryFeature.resolveConfig({ groups });
    groups[0]!.items[0] = { label: "Alterado", value: "<-" };

    expect(config?.groups).toEqual([
      { items: [{ label: "Reação", value: "->" }], label: "Setas" },
    ]);
  });

  it("provides the chemistry dialog toolbar item", () => {
    const config = chemistryFeature.resolveConfig(undefined);
    expect(config).not.toBeNull();
    expect(chemistryFeature.toolbarItems(config!)[0]).toMatchObject({
      icon: "lucide:flask-conical",
      key: "chemistry",
      label: "Fórmula química",
      type: "dialog",
    });
  });
});

describe("insertSnippet", () => {
  it("replaces the input selection and returns the next cursor position", () => {
    expect(insertSnippet("\\ce{H2 + O2}", "->", 7, 8)).toEqual({
      cursor: 9,
      value: "\\ce{H2 -> O2}",
    });
  });
});

describe("splitCeWrapper / joinCeWrapper (P3 — invólucro implícito)", () => {
  it("extrai o conteúdo interno de \\ce{...}", () => {
    expect(splitCeWrapper("\\ce{2H2 + O2 -> 2H2O}")).toEqual({
      inner: "2H2 + O2 -> 2H2O",
      wrapped: true,
    });
  });

  it("preserva latex fora do padrão como não embrulhado", () => {
    const source = splitCeWrapper("x \\ce{A} + \\ce{B}");

    expect(source.wrapped).toBe(false);
    expect(joinCeWrapper(source)).toBe("x \\ce{A} + \\ce{B}");
  });

  it("round-trip é byte a byte idêntico", () => {
    const samples = ["\\ce{H2O}", "\\ce{}", "\\ce{A -> B}", "E = mc^2"];

    for (const sample of samples) {
      expect(joinCeWrapper(splitCeWrapper(sample))).toBe(sample);
    }
  });
});
