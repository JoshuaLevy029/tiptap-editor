import Italic from "@tiptap/extension-italic";
import {
  defineFeature,
  resolveFeatureFlag,
  type EmptyFeatureConfig,
} from "../types";

export const italicFeature = defineFeature<"italic", EmptyFeatureConfig>({
  key: "italic",
  defaultEnabled: true,
  resolveConfig: (flag) => resolveFeatureFlag(flag, () => ({})),
  extensions: () => [Italic],
  toolbarItems: () => [
    {
      type: "toggle",
      key: "italic",
      label: "Itálico",
      icon: "lucide:italic",
      isActive: (editor) => editor.isActive("italic"),
      onClick: (editor) => editor.chain().focus().toggleItalic().run(),
    },
  ],
});
