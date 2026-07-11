import TextAlign from "@tiptap/extension-text-align";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type { TextAlignFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";

type Alignment = NonNullable<TextAlignFeatureConfig["alignments"]>[number];

const DEFAULT_ALIGNMENTS: readonly Alignment[] = [
  "left",
  "center",
  "right",
  "justify",
];

const ALIGNMENT_METADATA: Record<
  Alignment,
  { readonly icon: string; readonly label: string }
> = {
  left: { icon: "lucide:align-left", label: "Alinhar à esquerda" },
  center: { icon: "lucide:align-center", label: "Centralizar" },
  right: { icon: "lucide:align-right", label: "Alinhar à direita" },
  justify: { icon: "lucide:align-justify", label: "Justificar" },
};

interface ResolvedTextAlignFeatureConfig {
  readonly alignments: readonly Alignment[];
}

function isActive(editor: TiptapEditor, alignment: Alignment): boolean {
  return editor.isActive({ textAlign: alignment });
}

export const textAlignFeature = defineFeature<
  "textAlign",
  ResolvedTextAlignFeatureConfig
>({
  key: "textAlign",
  defaultEnabled: true,
  resolveConfig: (flag) => {
    const config = resolveFeatureFlag(flag, () => ({
      alignments: [...DEFAULT_ALIGNMENTS],
    }));

    if (config === null) {
      return null;
    }

    return {
      alignments: config.alignments
        ? [...new Set(config.alignments)]
        : [...DEFAULT_ALIGNMENTS],
    };
  },
  extensions: (config) => [
    TextAlign.configure({
      alignments: [...config.alignments],
      types: ["paragraph", "heading"],
    }),
  ],
  toolbarItems: (config) =>
    config.alignments.map((alignment) => ({
      type: "toggle" as const,
      key: `text-align-${alignment}`,
      label: ALIGNMENT_METADATA[alignment].label,
      icon: ALIGNMENT_METADATA[alignment].icon,
      isActive: (editor) => isActive(editor, alignment),
      onClick: (editor) => {
        editor.chain().focus().toggleTextAlign(alignment).run();
      },
    })),
});
