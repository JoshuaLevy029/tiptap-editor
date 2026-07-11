import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type { FontSizeFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";

const DEFAULT_SIZES = [
  { label: "Padrão", value: "" },
  { label: "12 px", value: "12px" },
  { label: "14 px", value: "14px" },
  { label: "16 px", value: "16px" },
  { label: "18 px", value: "18px" },
  { label: "20 px", value: "20px" },
  { label: "24 px", value: "24px" },
  { label: "32 px", value: "32px" },
  { label: "40 px", value: "40px" },
] as const;

function getFontSize(editor: TiptapEditor): string {
  const fontSize: unknown = editor.getAttributes("textStyle").fontSize;

  return typeof fontSize === "string" ? fontSize : "";
}

export const fontSizeFeature = defineFeature<"fontSize", FontSizeFeatureConfig>(
  {
    key: "fontSize",
    defaultEnabled: true,
    resolveConfig: (flag) =>
      resolveFeatureFlag(flag, () => ({ sizes: [...DEFAULT_SIZES] })),
    extensions: () => [TextStyle, FontSize],
    toolbarItems: (config) => [
      {
        type: "menu",
        key: "fontSize",
        label: "Tamanho do texto",
        icon: "mdi:format-size",
        options: config.sizes ?? DEFAULT_SIZES,
        getValue: getFontSize,
        onChange: (editor, value) => {
          const chain = editor.chain().focus();

          if (value === "") {
            chain.unsetFontSize().run();
            return;
          }

          chain.setFontSize(value).run();
        },
      },
    ],
  },
);
