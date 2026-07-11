import { ListItem, OrderedList } from "@tiptap/extension-list";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type { OrderedListFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";
import {
  DEFAULT_ORDERED_LIST_TYPES,
  getOrderedListTypeLabel,
  getOrderedListTypeMarkers,
  getOrderedListTypes,
  isOrderedListType,
  readOrderedListType,
  type OrderedListType,
} from "./helpers";

function applyType(editor: TiptapEditor, type: OrderedListType): void {
  const chain = editor.chain().focus();

  if (!editor.isActive("orderedList")) {
    chain.toggleOrderedList();
  }

  chain.updateAttributes("orderedList", { type }).run();
}

export const orderedListFeature = defineFeature<
  "orderedList",
  OrderedListFeatureConfig
>({
  key: "orderedList",
  defaultEnabled: true,
  resolveConfig: (flag) =>
    resolveFeatureFlag(flag, () => ({
      types: [...DEFAULT_ORDERED_LIST_TYPES],
    })),
  extensions: () => [OrderedList, ListItem],
  toolbarItems: (config) => {
    const types = getOrderedListTypes(config);
    const defaultType = types[0] ?? "1";

    return [
      {
        type: "menu",
        key: "orderedList",
        label: "Lista numerada",
        icon: "lucide:list-ordered",
        isActive: (editor) => editor.isActive("orderedList"),
        options: [
          ...types.map((type) => ({
            label: getOrderedListTypeLabel(type),
            markers: getOrderedListTypeMarkers(type),
            value: type,
          })),
          { label: "Remover lista", value: "" },
        ],
        getValue: (editor) => {
          if (!editor.isActive("orderedList")) {
            return "";
          }

          const current = readOrderedListType(
            editor.getAttributes("orderedList").type,
            defaultType,
          );

          return types.includes(current) ? current : defaultType;
        },
        onChange: (editor, value) => {
          if (value === "") {
            if (editor.isActive("orderedList")) {
              editor.chain().focus().toggleOrderedList().run();
            }
            return;
          }

          if (isOrderedListType(value) && types.includes(value)) {
            applyType(editor, value);
          }
        },
      },
    ];
  },
});
