import { BackgroundColor, TextStyle } from "@tiptap/extension-text-style";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type { ColorFeatureConfig } from "../../types";
import { DEFAULT_COLOR_PALETTE } from "../colorPalette";
import { defineFeature, resolveFeatureFlag } from "../types";

function getBackgroundColor(editor: TiptapEditor): string | undefined {
  const color: unknown = editor.getAttributes("textStyle").backgroundColor;

  return typeof color === "string" ? color : undefined;
}

export const backgroundColorFeature = defineFeature<
  "backgroundColor",
  ColorFeatureConfig
>({
  key: "backgroundColor",
  defaultEnabled: true,
  resolveConfig: (flag) =>
    resolveFeatureFlag(flag, () => ({ colors: [...DEFAULT_COLOR_PALETTE] })),
  extensions: () => [TextStyle, BackgroundColor],
  toolbarItems: (config) => [
    {
      type: "colorPicker",
      key: "backgroundColor",
      label: "Cor de fundo do texto",
      icon: "material-symbols:format-color-fill",
      colors: config.colors ?? DEFAULT_COLOR_PALETTE,
      unsetLabel: "Sem cor de fundo",
      allowCustom: true,
      getValue: getBackgroundColor,
      onChange: (editor: TiptapEditor, value: string) => {
        const chain = editor.chain().focus();

        if (value === "") {
          chain.unsetBackgroundColor().run();
          return;
        }

        chain.setBackgroundColor(value).run();
      },
    },
  ],
});
