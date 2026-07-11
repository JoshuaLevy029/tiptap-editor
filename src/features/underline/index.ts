import Underline from "@tiptap/extension-underline";
import {
  defineFeature,
  resolveFeatureFlag,
  type EmptyFeatureConfig,
} from "../types";

export const underlineFeature = defineFeature<"underline", EmptyFeatureConfig>({
  key: "underline",
  defaultEnabled: true,
  resolveConfig: (flag) => resolveFeatureFlag(flag, () => ({})),
  extensions: () => [Underline],
  toolbarItems: () => [
    {
      type: "toggle",
      key: "underline",
      label: "Sublinhado",
      icon: "lucide:underline",
      isActive: (editor) => editor.isActive("underline"),
      onClick: (editor) => editor.chain().focus().toggleUnderline().run(),
    },
  ],
});
