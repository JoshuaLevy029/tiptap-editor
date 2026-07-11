import Superscript from "@tiptap/extension-superscript";
import {
  defineFeature,
  resolveFeatureFlag,
  type EmptyFeatureConfig,
} from "../types";

export const superscriptFeature = defineFeature<
  "superscript",
  EmptyFeatureConfig
>({
  key: "superscript",
  defaultEnabled: true,
  resolveConfig: (flag) => resolveFeatureFlag(flag, () => ({})),
  extensions: () => [Superscript],
  toolbarItems: () => [
    {
      type: "toggle",
      key: "superscript",
      label: "Sobrescrito",
      icon: "lucide:superscript",
      isActive: (editor) => editor.isActive("superscript"),
      onClick: (editor) => {
        let chain = editor.chain().focus();

        if (editor.isActive("subscript")) {
          chain = chain.unsetSubscript();
        }

        chain.toggleSuperscript().run();
      },
    },
  ],
});
