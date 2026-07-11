import { Extension } from "@tiptap/react";
import { lazy } from "react";
import "katex/dist/katex.min.css";
import type { MathFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";
import {
  DEFAULT_KEYBOARD_LAYOUTS,
  DEFAULT_TEMPLATES,
  MATH_UI_STORAGE_KEY,
  openSelectedMathDialog,
} from "./helpers";
import { FORMULA_NODES_EXTENSION, MATH_TOOLBAR_LABEL } from "./formulaNodes";

const MathDialog = lazy(() => import("./MathDialog"));

const DEFAULT_CONFIG: Required<MathFeatureConfig> = {
  keyboardLayouts: [...DEFAULT_KEYBOARD_LAYOUTS],
  templates: [...DEFAULT_TEMPLATES],
};

function createMathUiBridge(config: MathFeatureConfig) {
  const keyboardLayouts = config.keyboardLayouts ?? DEFAULT_KEYBOARD_LAYOUTS;
  const templates = config.templates ?? DEFAULT_TEMPLATES;

  return Extension.create({
    name: MATH_UI_STORAGE_KEY,
    addKeyboardShortcuts() {
      return {
        Enter: () => openSelectedMathDialog(this.editor),
      };
    },
    addStorage() {
      return {
        keyboardLayouts: [...keyboardLayouts],
        templates: [...templates],
      };
    },
  });
}

export const mathFeature = defineFeature<"math", MathFeatureConfig>({
  key: "math",
  defaultEnabled: true,
  resolveConfig: (flag) =>
    resolveFeatureFlag(flag, () => ({
      keyboardLayouts: [...DEFAULT_CONFIG.keyboardLayouts],
      templates: [...DEFAULT_CONFIG.templates],
    })),
  extensions: (config) => [FORMULA_NODES_EXTENSION, createMathUiBridge(config)],
  toolbarItems: () => [
    {
      type: "dialog",
      key: "math",
      label: MATH_TOOLBAR_LABEL,
      icon: "lucide:sigma",
      component: MathDialog,
      isActive: (editor) =>
        editor.isActive("inlineMath", { kind: "math" }) ||
        editor.isActive("blockMath", { kind: "math" }),
    },
  ],
});
