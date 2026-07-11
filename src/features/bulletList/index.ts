import { BulletList, ListItem } from "@tiptap/extension-list";
import type { Editor as TiptapEditor } from "@tiptap/react";
import type { BulletListFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";
import {
  DEFAULT_BULLET_LIST_STYLES,
  getBulletListStyleLabel,
  getBulletListStyleMarkers,
  getBulletListStyles,
  isBulletListStyle,
  parseBulletListStyle,
  readBulletListStyle,
  toCssListStyleType,
  type BulletListStyle,
} from "./helpers";

function createBulletListExtension(defaultStyle: BulletListStyle) {
  return BulletList.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        listStyleType: {
          default: defaultStyle,
          parseHTML: (element: HTMLElement) =>
            parseBulletListStyle(element, defaultStyle),
          renderHTML: (attributes: Record<string, unknown>) => ({
            style: `list-style-type: ${toCssListStyleType(
              readBulletListStyle(attributes.listStyleType, defaultStyle),
            )}`,
          }),
        },
      };
    },
  });
}

function applyStyle(editor: TiptapEditor, style: BulletListStyle): void {
  const chain = editor.chain().focus();

  if (!editor.isActive("bulletList")) {
    chain.toggleBulletList();
  }

  chain.updateAttributes("bulletList", { listStyleType: style }).run();
}

export const bulletListFeature = defineFeature<
  "bulletList",
  BulletListFeatureConfig
>({
  key: "bulletList",
  defaultEnabled: true,
  resolveConfig: (flag) =>
    resolveFeatureFlag(flag, () => ({
      styles: [...DEFAULT_BULLET_LIST_STYLES],
    })),
  extensions: (config) => {
    const styles = getBulletListStyles(config);
    const defaultStyle = styles[0] ?? "disc";

    return [createBulletListExtension(defaultStyle), ListItem];
  },
  toolbarItems: (config) => {
    const styles = getBulletListStyles(config);
    const defaultStyle = styles[0] ?? "disc";

    return [
      {
        type: "menu",
        key: "bulletList",
        label: "Lista com marcadores",
        icon: "lucide:list",
        isActive: (editor) => editor.isActive("bulletList"),
        options: [
          ...styles.map((style) => ({
            label: getBulletListStyleLabel(style),
            markers: getBulletListStyleMarkers(style),
            value: style,
          })),
          { label: "Remover lista", value: "" },
        ],
        getValue: (editor) => {
          if (!editor.isActive("bulletList")) {
            return "";
          }

          const current = readBulletListStyle(
            editor.getAttributes("bulletList").listStyleType,
            defaultStyle,
          );

          return styles.includes(current) ? current : defaultStyle;
        },
        onChange: (editor, value) => {
          if (value === "") {
            if (editor.isActive("bulletList")) {
              editor.chain().focus().toggleBulletList().run();
            }
            return;
          }

          if (isBulletListStyle(value) && styles.includes(value)) {
            applyStyle(editor, value);
          }
        },
      },
    ];
  },
});
