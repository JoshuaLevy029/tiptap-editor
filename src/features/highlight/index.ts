import Highlight from "@tiptap/extension-highlight";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type { ColorFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";

const DEFAULT_COLORS = [
  "#fff59d",
  "#ffcc80",
  "#ef9a9a",
  "#ce93d8",
  "#90caf9",
  "#a5d6a7",
] as const;

function getHighlightColor(editor: TiptapEditor): string {
  const color: unknown = editor.getAttributes("highlight").color;

  return typeof color === "string" ? color : "";
}

export const highlightFeature = defineFeature<"highlight", ColorFeatureConfig>({
  key: "highlight",
  defaultEnabled: true,
  resolveConfig: (flag) =>
    resolveFeatureFlag(flag, () => ({ colors: [...DEFAULT_COLORS] })),
  extensions: () => [Highlight.configure({ multicolor: true })],
  toolbarItems: (config) => {
    const colors = config.colors ?? DEFAULT_COLORS;

    return [
      {
        type: "colorPicker",
        key: "highlight",
        label: "Marca-texto",
        icon: "material-symbols:ink-highlighter",
        colors,
        unsetLabel: "Sem marcação",
        getValue: (editor) => {
          const color = getHighlightColor(editor);

          return color === "" ? undefined : color;
        },
        onChange: (editor, value) => {
          const chain = editor.chain().focus();

          if (value === "") {
            chain.unsetHighlight().run();
            return;
          }

          chain.setHighlight({ color: value }).run();
        },
      },
    ];
  },
});
