import type { Editor as TiptapEditor } from "@tiptap/react";
import type { IndentFeatureConfig } from "../../types";

export interface IndentOptions {
  readonly maxLevel: number;
  readonly step: number;
}

export type IndentDirection = "decrease" | "increase";

export const DEFAULT_INDENT_OPTIONS: IndentOptions = {
  maxLevel: 8,
  step: 2,
};

function normalizeMaxLevel(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_INDENT_OPTIONS.maxLevel;
  }

  return Math.max(0, Math.trunc(value));
}

function normalizeStep(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_INDENT_OPTIONS.step;
  }

  return value;
}

export function getIndentOptions(config: IndentFeatureConfig): IndentOptions {
  return {
    maxLevel: normalizeMaxLevel(config.maxLevel),
    step: normalizeStep(config.step),
  };
}

export function readIndentLevel(value: unknown, maxLevel: number): number {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : 0;

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(maxLevel, Math.max(0, Math.trunc(numericValue)));
}

export function parseIndentLevel(
  element: HTMLElement,
  options: IndentOptions,
): number {
  const storedLevel = element.getAttribute("data-indent");

  if (storedLevel !== null) {
    return readIndentLevel(storedLevel, options.maxLevel);
  }

  const margin = Number.parseFloat(element.style.marginLeft);

  if (!Number.isFinite(margin)) {
    return 0;
  }

  return readIndentLevel(Math.round(margin / options.step), options.maxLevel);
}

export function toIndentMargin(level: number, step: number): string {
  return `${Number((level * step).toFixed(4))}rem`;
}

export function isListActive(editor: TiptapEditor): boolean {
  return editor.isActive("bulletList") || editor.isActive("orderedList");
}

function isIndentableNode(nodeTypeName: string): boolean {
  return nodeTypeName === "paragraph" || nodeTypeName === "heading";
}

function canChangeBlockIndent(
  editor: TiptapEditor,
  direction: IndentDirection,
  options: IndentOptions,
): boolean {
  const { from, to } = editor.state.selection;
  let canChange = false;

  editor.state.doc.nodesBetween(from, to, (node) => {
    if (!isIndentableNode(node.type.name)) {
      return;
    }

    const level = readIndentLevel(node.attrs.indent, options.maxLevel);
    canChange ||=
      direction === "increase" ? level < options.maxLevel : level > 0;

    return false;
  });

  return canChange;
}

export function isIndentDisabled(
  editor: TiptapEditor,
  direction: IndentDirection,
  options: IndentOptions,
): boolean {
  if (isListActive(editor)) {
    return direction === "increase"
      ? !editor.can().sinkListItem("listItem")
      : !editor.can().liftListItem("listItem");
  }

  return !canChangeBlockIndent(editor, direction, options);
}

export function applyIndent(
  editor: TiptapEditor,
  direction: IndentDirection,
  options: IndentOptions,
): void {
  if (isListActive(editor)) {
    const chain = editor.chain().focus();

    if (direction === "increase") {
      chain.sinkListItem("listItem").run();
    } else {
      chain.liftListItem("listItem").run();
    }

    return;
  }

  const delta = direction === "increase" ? 1 : -1;

  editor
    .chain()
    .focus()
    .command(({ state, tr }) => {
      const { from, to } = state.selection;
      let changed = false;

      state.doc.nodesBetween(from, to, (node, position) => {
        if (!isIndentableNode(node.type.name)) {
          return;
        }

        const currentLevel = readIndentLevel(
          node.attrs.indent,
          options.maxLevel,
        );
        const nextLevel = readIndentLevel(
          currentLevel + delta,
          options.maxLevel,
        );

        if (nextLevel !== currentLevel) {
          tr.setNodeMarkup(
            position,
            undefined,
            { ...node.attrs, indent: nextLevel },
            node.marks,
          );
          changed = true;
        }

        return false;
      });

      return changed;
    })
    .run();
}
