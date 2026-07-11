import { Color, TextStyle } from "@tiptap/extension-text-style";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type { ColorFeatureConfig } from "../../types";
import { DEFAULT_COLOR_PALETTE } from "../colorPalette";
import { defineFeature, resolveFeatureFlag } from "../types";

function getTextColor(editor: TiptapEditor): string | undefined {
  const color: unknown = editor.getAttributes("textStyle").color;

  return typeof color === "string" ? color : undefined;
}

export const textColorFeature = defineFeature<"textColor", ColorFeatureConfig>({
  key: "textColor",
  defaultEnabled: true,
  resolveConfig: (flag) =>
    resolveFeatureFlag(flag, () => ({ colors: [...DEFAULT_COLOR_PALETTE] })),
  extensions: () => [TextStyle, Color],
  toolbarItems: (config) => [
    {
      type: "colorPicker",
      key: "textColor",
      label: "Cor do texto",
      icon: "material-symbols:format-color-text",
      colors: config.colors ?? DEFAULT_COLOR_PALETTE,
      unsetLabel: "Cor automática",
      allowCustom: true,
      getValue: getTextColor,
      onChange: (editor: TiptapEditor, value: string) => {
        const chain = editor.chain().focus();

        if (value === "") {
          chain.unsetColor().run();
          return;
        }

        chain.setColor(value).run();
      },
    },
  ],
});
