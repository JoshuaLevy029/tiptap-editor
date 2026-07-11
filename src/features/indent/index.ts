import { Extension } from "@tiptap/react";
import type { IndentFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";
import {
  applyIndent,
  DEFAULT_INDENT_OPTIONS,
  getIndentOptions,
  isIndentDisabled,
  parseIndentLevel,
  readIndentLevel,
  toIndentMargin,
  type IndentOptions,
} from "./helpers";

function createIndentExtension(options: IndentOptions) {
  return Extension.create({
    name: "indent",
    addGlobalAttributes() {
      return [
        {
          types: ["paragraph", "heading"],
          attributes: {
            indent: {
              default: 0,
              parseHTML: (element) => parseIndentLevel(element, options),
              renderHTML: (attributes) => {
                const level = readIndentLevel(
                  attributes.indent,
                  options.maxLevel,
                );

                if (level === 0) {
                  return {};
                }

                return {
                  "data-indent": String(level),
                  style: `margin-left: ${toIndentMargin(level, options.step)}`,
                };
              },
            },
          },
        },
      ];
    },
  });
}

export const indentFeature = defineFeature<"indent", IndentFeatureConfig>({
  key: "indent",
  defaultEnabled: true,
  resolveConfig: (flag) =>
    resolveFeatureFlag(flag, () => ({ ...DEFAULT_INDENT_OPTIONS })),
  extensions: (config) => [createIndentExtension(getIndentOptions(config))],
  toolbarItems: (config) => {
    const options = getIndentOptions(config);

    return [
      {
        type: "toggle",
        key: "indentDecrease",
        label: "Diminuir recuo",
        icon: "lucide:indent-decrease",
        isActive: () => false,
        isDisabled: (editor) => isIndentDisabled(editor, "decrease", options),
        onClick: (editor) => applyIndent(editor, "decrease", options),
      },
      {
        type: "toggle",
        key: "indentIncrease",
        label: "Aumentar recuo",
        icon: "lucide:indent-increase",
        isActive: () => false,
        isDisabled: (editor) => isIndentDisabled(editor, "increase", options),
        onClick: (editor) => applyIndent(editor, "increase", options),
      },
    ];
  },
});
