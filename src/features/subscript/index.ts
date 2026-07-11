import Subscript from "@tiptap/extension-subscript";
import {
  defineFeature,
  resolveFeatureFlag,
  type EmptyFeatureConfig,
} from "../types";

export const subscriptFeature = defineFeature<"subscript", EmptyFeatureConfig>({
  key: "subscript",
  defaultEnabled: true,
  resolveConfig: (flag) => resolveFeatureFlag(flag, () => ({})),
  extensions: () => [Subscript],
  toolbarItems: () => [
    {
      type: "toggle",
      key: "subscript",
      label: "Subscrito",
      icon: "lucide:subscript",
      isActive: (editor) => editor.isActive("subscript"),
      onClick: (editor) => {
        let chain = editor.chain().focus();

        if (editor.isActive("superscript")) {
          chain = chain.unsetSuperscript();
        }

        chain.toggleSubscript().run();
      },
    },
  ],
});
