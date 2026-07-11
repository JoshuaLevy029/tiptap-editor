import Bold from "@tiptap/extension-bold";
import {
  defineFeature,
  resolveFeatureFlag,
  type EmptyFeatureConfig,
} from "../types";

export const boldFeature = defineFeature<"bold", EmptyFeatureConfig>({
  key: "bold",
  defaultEnabled: true,
  resolveConfig: (flag) => resolveFeatureFlag(flag, () => ({})),
  extensions: () => [Bold],
  toolbarItems: () => [
    {
      type: "toggle",
      key: "bold",
      label: "Negrito",
      icon: "lucide:bold",
      isActive: (editor) => editor.isActive("bold"),
      onClick: (editor) => editor.chain().focus().toggleBold().run(),
    },
  ],
});
