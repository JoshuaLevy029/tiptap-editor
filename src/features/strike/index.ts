import Strike from "@tiptap/extension-strike";
import {
  defineFeature,
  resolveFeatureFlag,
  type EmptyFeatureConfig,
} from "../types";

export const strikeFeature = defineFeature<"strike", EmptyFeatureConfig>({
  key: "strike",
  defaultEnabled: true,
  resolveConfig: (flag) => resolveFeatureFlag(flag, () => ({})),
  extensions: () => [Strike],
  toolbarItems: () => [
    {
      type: "toggle",
      key: "strike",
      label: "Tachado",
      icon: "lucide:strikethrough",
      isActive: (editor) => editor.isActive("strike"),
      onClick: (editor) => editor.chain().focus().toggleStrike().run(),
    },
  ],
});
