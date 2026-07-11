import { FontFamily, TextStyle } from "@tiptap/extension-text-style";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type { FontFamilyFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";

const DEFAULT_FONTS = [
  { label: "Padrão", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: '"Times New Roman", serif' },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: '"Trebuchet MS", sans-serif' },
  { label: "Courier New", value: '"Courier New", monospace' },
] as const;

function getFontFamily(editor: TiptapEditor): string {
  const fontFamily: unknown = editor.getAttributes("textStyle").fontFamily;

  return typeof fontFamily === "string" ? fontFamily : "";
}

export const fontFamilyFeature = defineFeature<
  "fontFamily",
  FontFamilyFeatureConfig
>({
  key: "fontFamily",
  defaultEnabled: true,
  resolveConfig: (flag) =>
    resolveFeatureFlag(flag, () => ({ fonts: [...DEFAULT_FONTS] })),
  extensions: () => [TextStyle, FontFamily],
  toolbarItems: (config) => [
    {
      type: "menu",
      key: "fontFamily",
      label: "Fonte",
      icon: "mdi:format-font",
      options: (config.fonts ?? DEFAULT_FONTS).map((font) =>
        font.value === ""
          ? { label: font.label, value: font.value }
          : {
              label: font.label,
              value: font.value,
              labelSx: { fontFamily: font.value },
            },
      ),
      getValue: getFontFamily,
      onChange: (editor, value) => {
        const chain = editor.chain().focus();

        if (value === "") {
          chain.unsetFontFamily().run();
          return;
        }

        chain.setFontFamily(value).run();
      },
    },
  ],
});
