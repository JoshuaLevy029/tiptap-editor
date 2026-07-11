import { Node, mergeAttributes } from "@tiptap/react";
import type { ColumnsFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";

const DEFAULT_COUNTS: readonly number[] = [2, 3];

function parseCount(value: unknown): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : value;

  return typeof parsed === "number" && parsed >= 2 && parsed <= 4
    ? parsed
    : 2;
}

/**
 * Bloco de colunas estilo jornal: o conteúdo flui entre as colunas via CSS
 * multi-column. Também interpreta o formato `div.cols` do pipeline de
 * apostilas (duas colunas explícitas viram um bloco de fluxo contínuo).
 */
const ColumnsNode = Node.create({
  name: "columns",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      count: {
        default: 2,
        parseHTML: (element) =>
          parseCount(
            element.getAttribute("data-count") ??
              element.style.columnCount ??
              undefined,
          ),
        renderHTML: (attributes) => ({
          "data-count": String(attributes.count),
          style: `column-count:${parseCount(attributes.count)};column-gap:32px;`,
        }),
      },
    };
  },
  parseHTML() {
    return [
      { tag: 'div[data-type="columns"]' },
      // Formato do pipeline de apostilas: <div class="cols"><div class="col">…
      { tag: "div.cols", getAttrs: () => ({ count: 2 }) },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "columns" }),
      0,
    ];
  },
});

export const columnsFeature = defineFeature<"columns", ColumnsFeatureConfig>({
  key: "columns",
  defaultEnabled: true,
  resolveConfig: (flag) =>
    resolveFeatureFlag(flag, () => ({ counts: [...DEFAULT_COUNTS] })),
  extensions: () => [ColumnsNode],
  toolbarItems: (config) => {
    const counts = (config.counts ?? DEFAULT_COUNTS).filter(
      (count) => count >= 2 && count <= 4,
    );

    return [
      {
        type: "menu",
        key: "columns",
        label: "Colunas",
        icon: "material-symbols:view-column-2-outline",
        isActive: (editor) => editor.isActive("columns"),
        options: [
          ...counts.map((count) => ({
            label: `${count} colunas`,
            value: String(count),
          })),
          { label: "Remover colunas", value: "" },
        ],
        getValue: (editor) => {
          if (!editor.isActive("columns")) {
            return "";
          }

          return String(parseCount(editor.getAttributes("columns").count));
        },
        onChange: (editor, value) => {
          if (value === "") {
            if (editor.isActive("columns")) {
              editor.chain().focus().lift("columns").run();
            }
            return;
          }

          const count = parseCount(value);

          if (editor.isActive("columns")) {
            editor
              .chain()
              .focus()
              .updateAttributes("columns", { count })
              .run();
            return;
          }

          editor.chain().focus().wrapIn("columns", { count }).run();
        },
      },
    ];
  },
});
