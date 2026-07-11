import { UndoRedo } from "@tiptap/extensions";
import {
  defineFeature,
  resolveFeatureFlag,
  type EmptyFeatureConfig,
} from "../types";

export const undoRedoFeature = defineFeature<"undoRedo", EmptyFeatureConfig>({
  key: "undoRedo",
  defaultEnabled: true,
  resolveConfig: (flag) => resolveFeatureFlag(flag, () => ({})),
  extensions: () => [UndoRedo],
  toolbarItems: () => [
    {
      type: "toggle",
      key: "undo",
      label: "Desfazer",
      icon: "lucide:undo-2",
      isActive: () => false,
      isDisabled: (editor) => !editor.can().chain().focus().undo().run(),
      onClick: (editor) => editor.chain().focus().undo().run(),
    },
    {
      type: "toggle",
      key: "redo",
      label: "Refazer",
      icon: "lucide:redo-2",
      isActive: () => false,
      isDisabled: (editor) => !editor.can().chain().focus().redo().run(),
      onClick: (editor) => editor.chain().focus().redo().run(),
    },
  ],
});
