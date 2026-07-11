import { LineHeight, TextStyle } from "@tiptap/extension-text-style";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type { LineHeightFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";

const DEFAULT_OPTIONS = [
  { label: "Simples (1,0)", value: "1" },
  { label: "1,15", value: "1.15" },
  { label: "1,5", value: "1.5" },
  { label: "Dupla (2,0)", value: "2" },
] as const;

function getLineHeight(editor: TiptapEditor): string {
  const lineHeight: unknown = editor.getAttributes("textStyle").lineHeight;

  return typeof lineHeight === "string" ? lineHeight : "";
}

export const lineHeightFeature = defineFeature<
  "lineHeight",
  LineHeightFeatureConfig
>({
  key: "lineHeight",
  defaultEnabled: true,
  resolveConfig: (flag) =>
    resolveFeatureFlag(flag, () => ({
      options: DEFAULT_OPTIONS.map((option) => ({ ...option })),
    })),
  extensions: () => [TextStyle, LineHeight],
  toolbarItems: (config) => [
    {
      type: "menu",
      key: "lineHeight",
      label: "Espaçamento entre linhas",
      icon: "material-symbols:format-line-spacing",
      options: [
        ...(config.options ?? DEFAULT_OPTIONS),
        { label: "Padrão", value: "" },
      ],
      getValue: getLineHeight,
      onChange: (editor, value) => {
        const chain = editor.chain().focus();

        if (value === "") {
          chain.unsetLineHeight().run();
          return;
        }

        chain.setLineHeight(value).run();
      },
    },
  ],
});
