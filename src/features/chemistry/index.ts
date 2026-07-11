import { Extension } from "@tiptap/react";
import "katex/contrib/mhchem";
import "katex/dist/katex.min.css";
import { lazy } from "react";
import type { ChemistryFeatureConfig, FeatureFlag } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";
import {
  DEFAULT_CHEMISTRY_GROUPS,
  DEFAULT_CHEMISTRY_TEMPLATES,
  type ChemistryUiOptions,
  openSelectedChemistryDialog,
} from "./helpers";
import {
  CHEMISTRY_TOOLBAR_LABEL,
  FORMULA_NODES_EXTENSION,
} from "../math/formulaNodes";

const ChemistryDialog = lazy(() => import("./ChemistryDialog"));

const ChemistryUi = Extension.create<ChemistryUiOptions>({
  name: "chemistryUi",
  addOptions() {
    return {
      groups: DEFAULT_CHEMISTRY_GROUPS,
      templates: DEFAULT_CHEMISTRY_TEMPLATES,
    };
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => openSelectedChemistryDialog(this.editor),
    };
  },
});

function resolveChemistryConfig(
  flag: FeatureFlag<ChemistryFeatureConfig>,
): ChemistryFeatureConfig | null {
  const config = resolveFeatureFlag<ChemistryFeatureConfig>(flag, () => ({}));

  if (config === null) {
    return null;
  }

  const groups =
    config.groups ??
    // Legado: lista plana de palette vira categoria única.
    (config.palette === undefined
      ? DEFAULT_CHEMISTRY_GROUPS
      : [{ items: config.palette, label: "Paleta" }]);

  return {
    groups: groups.map((group) => ({
      items: group.items.map((item) => ({ ...item })),
      label: group.label,
    })),
    templates: (config.templates ?? DEFAULT_CHEMISTRY_TEMPLATES).map(
      (item) => ({ ...item }),
    ),
  };
}

export const chemistryFeature = defineFeature<
  "chemistry",
  ChemistryFeatureConfig
>({
  key: "chemistry",
  defaultEnabled: true,
  resolveConfig: resolveChemistryConfig,
  extensions: (config) => [
    FORMULA_NODES_EXTENSION,
    ChemistryUi.configure({
      groups: config.groups ?? DEFAULT_CHEMISTRY_GROUPS,
      templates: config.templates ?? DEFAULT_CHEMISTRY_TEMPLATES,
    }),
  ],
  toolbarItems: () => [
    {
      type: "dialog",
      key: "chemistry",
      label: CHEMISTRY_TOOLBAR_LABEL,
      icon: "lucide:flask-conical",
      component: ChemistryDialog,
      isActive: (editor) =>
        editor.isActive("inlineMath", { kind: "chemistry" }) ||
        editor.isActive("blockMath", { kind: "chemistry" }),
      isDisabled: (editor) => !editor.isEditable,
    },
  ],
});
