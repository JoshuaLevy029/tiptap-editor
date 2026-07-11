import {
  BlockMath,
  InlineMath,
  Mathematics,
} from "@tiptap/extension-mathematics";
import type { Editor as TiptapEditor } from "@tiptap/react";

export const MATH_TOOLBAR_LABEL = "Fórmula matemática";
export const CHEMISTRY_TOOLBAR_LABEL = "Fórmula química";

const formulaKindAttribute = {
  default: "math",
  parseHTML: (element: HTMLElement): "chemistry" | "math" =>
    element.getAttribute("data-kind") === "chemistry" ? "chemistry" : "math",
  renderHTML: (
    attributes: Record<string, unknown>,
  ): Record<string, string> => ({
    "data-kind": attributes.kind === "chemistry" ? "chemistry" : "math",
  }),
};

function findToolbarButton(
  editor: TiptapEditor,
  label: string,
): HTMLButtonElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const root = editor.view.dom.closest(".MuiPaper-root") ?? document;
  const buttons =
    root.querySelectorAll<HTMLButtonElement>("button[aria-label]");

  return (
    Array.from(buttons).find(
      (button) => button.getAttribute("aria-label") === label,
    ) ?? null
  );
}

export function openFormulaDialogAt(
  editor: TiptapEditor,
  position: number,
): boolean {
  const node = editor.state.doc.nodeAt(position);

  if (
    node === null ||
    (node.type.name !== "inlineMath" && node.type.name !== "blockMath")
  ) {
    return false;
  }

  const selected = editor.chain().focus().setNodeSelection(position).run();

  if (selected) {
    const label =
      node.attrs.kind === "chemistry"
        ? CHEMISTRY_TOOLBAR_LABEL
        : MATH_TOOLBAR_LABEL;
    queueMicrotask(() => findToolbarButton(editor, label)?.click());
  }

  return selected;
}

export const FORMULA_NODES_EXTENSION = Mathematics.extend({
  addExtensions() {
    // "addExtensions" roda sem editor no contexto; os nodes filhos capturam a
    // instância em onCreate para o clique abrir o dialog no editor correto.
    const editorRef: { current: TiptapEditor | null } = { current: null };
    const onClick = (_node: unknown, position: number) => {
      if (editorRef.current !== null) {
        openFormulaDialogAt(editorRef.current, position);
      }
    };
    const katexOptions = {
      errorColor: "#d32f2f",
      strict: "warn" as const,
      throwOnError: false,
      trust: false,
    };

    const FormulaInlineMath = InlineMath.extend({
      onCreate(event) {
        this.parent?.(event);
        editorRef.current = this.editor;
      },
      addAttributes() {
        return {
          ...(this.parent?.() ?? {}),
          kind: formulaKindAttribute,
        };
      },
    }).configure({ katexOptions, onClick });

    const FormulaBlockMath = BlockMath.extend({
      onCreate(event) {
        this.parent?.(event);
        editorRef.current = this.editor;
      },
      addAttributes() {
        return {
          ...(this.parent?.() ?? {}),
          kind: formulaKindAttribute,
        };
      },
    }).configure({ katexOptions, onClick });

    return [FormulaBlockMath, FormulaInlineMath];
  },
});
