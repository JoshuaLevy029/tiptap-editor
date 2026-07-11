import type { Editor as TiptapEditor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import katex from "katex";
import type { MathKeyboardLayout } from "../../types";
import { openFormulaDialogAt } from "./formulaNodes";

export const MATH_UI_STORAGE_KEY = "mathUiBridge";

/** Aba customizada do teclado virtual: geometria e decorações (ângulos, segmentos, vetores). */
export const GEOMETRY_KEYBOARD_LAYOUT: Record<string, unknown> = {
  label: "∠△",
  tooltip: "Geometria e decorações",
  rows: [
    [
      { insert: "\\hat{#0}", latex: "\\hat{x}" },
      { insert: "\\widehat{#0}", latex: "\\widehat{AB}" },
      { insert: "\\bar{#0}", latex: "\\bar{x}" },
      { insert: "\\overline{#0}", latex: "\\overline{AB}" },
      { insert: "\\vec{#0}", latex: "\\vec{v}" },
      { insert: "\\overrightarrow{#0}", latex: "\\overrightarrow{AB}" },
    ],
    [
      "\\angle",
      "\\triangle",
      { insert: "^{\\circ}", latex: "x^{\\circ}" },
      "\\perp",
      "\\parallel",
      "\\cong",
      "\\sim",
      "\\equiv",
    ],
  ],
};

export const DEFAULT_KEYBOARD_LAYOUTS: readonly MathKeyboardLayout[] = [
  "numeric",
  "symbols",
  "alphabetic",
  "greek",
  GEOMETRY_KEYBOARD_LAYOUT,
];

export const DEFAULT_TEMPLATES = [
  String.raw`\frac{#0}{#?}`,
  String.raw`\sqrt[#?]{#0}`,
  String.raw`\int_{#?}^{#?}#0\,\mathrm{d}x`,
  String.raw`\sum_{#?}^{#?}#0`,
  String.raw`\prod_{#?}^{#?}#0`,
  // Notação de ângulo (geometria): C\hat{P}N; \widehat{...} cobre várias letras
  String.raw`\hat{#0}`,
  String.raw`\widehat{#0}`,
] as const;

export type MathNodeKind = "inlineMath" | "blockMath";

export interface MathNodeTarget {
  readonly kind: MathNodeKind;
  readonly latex: string;
  readonly pos: number;
}

export interface MathDialogSession {
  readonly originalLatex: string;
  readonly selection: Readonly<{ from: number; to: number }>;
  readonly target: MathNodeTarget | null;
}

export interface MathUiStorage {
  readonly keyboardLayouts: readonly MathKeyboardLayout[];
  readonly templates: readonly string[];
}

export interface LatexPreview {
  readonly error: string | null;
  readonly html: string | null;
}

export type MathCommitResult = "inserted" | "updated" | "unchanged" | "stale";

function isMathNodeKind(value: string): value is MathNodeKind {
  return value === "inlineMath" || value === "blockMath";
}

export function createMathDialogSession(
  editor: TiptapEditor,
): MathDialogSession {
  const { selection } = editor.state;

  if (
    selection instanceof NodeSelection &&
    isMathNodeKind(selection.node.type.name) &&
    selection.node.attrs.kind !== "chemistry"
  ) {
    const latex = selection.node.attrs.latex;

    return {
      originalLatex: typeof latex === "string" ? latex : "",
      selection: { from: selection.from, to: selection.to },
      target: {
        kind: selection.node.type.name,
        latex: typeof latex === "string" ? latex : "",
        pos: selection.from,
      },
    };
  }

  return {
    originalLatex: "",
    selection: { from: selection.from, to: selection.to },
    target: null,
  };
}

export function commitMathDialog(
  editor: TiptapEditor,
  session: MathDialogSession,
  kind: MathNodeKind,
  latex: string,
): MathCommitResult {
  if (session.target !== null) {
    const target = session.target;
    const currentNode = editor.state.doc.nodeAt(target.pos);

    if (
      currentNode === null ||
      currentNode.type.name !== target.kind ||
      currentNode.attrs.kind === "chemistry" ||
      currentNode.attrs.latex !== session.originalLatex
    ) {
      return "stale";
    }

    if (latex === session.originalLatex) {
      return "unchanged";
    }

    const didUpdate = editor
      .chain()
      .focus()
      .command(({ tr }) => {
        const node = tr.doc.nodeAt(target.pos);

        if (
          node === null ||
          node.type.name !== target.kind ||
          node.attrs.kind === "chemistry" ||
          node.attrs.latex !== session.originalLatex
        ) {
          return false;
        }

        tr.setNodeMarkup(
          target.pos,
          node.type,
          {
            ...node.attrs,
            kind: "math",
            latex,
          },
          node.marks,
        );
        return true;
      })
      .run();

    return didUpdate ? "updated" : "stale";
  }

  const didInsert = editor
    .chain()
    .focus()
    .insertContentAt(session.selection, {
      type: kind,
      attrs: { kind: "math", latex },
    })
    .run();

  return didInsert ? "inserted" : "stale";
}

export function renderLatexPreview(
  latex: string,
  displayMode: boolean,
): LatexPreview {
  try {
    return {
      error: null,
      html: katex.renderToString(latex, {
        displayMode,
        output: "htmlAndMathml",
        strict: "warn",
        throwOnError: true,
        trust: false,
      }),
    };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "LaTeX não renderizável.",
      html: null,
    };
  }
}

export function isFaithfulMathLiveRoundTrip(
  original: string,
  serialized: string,
): boolean {
  return original === serialized;
}

export function readMathUiStorage(editor: TiptapEditor): MathUiStorage {
  const storage = (editor.storage as unknown as Record<string, unknown>)[
    MATH_UI_STORAGE_KEY
  ];

  if (isMathUiStorage(storage)) {
    return storage;
  }

  return {
    keyboardLayouts: DEFAULT_KEYBOARD_LAYOUTS,
    templates: DEFAULT_TEMPLATES,
  };
}

function isMathUiStorage(value: unknown): value is MathUiStorage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<MathUiStorage>;
  return (
    isLayoutArray(candidate.keyboardLayouts) &&
    isStringArray(candidate.templates)
  );
}

function isLayoutArray(
  value: unknown,
): value is readonly MathKeyboardLayout[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "string" ||
        (typeof item === "object" && item !== null),
    )
  );
}

function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

export function openMathDialogAt(editor: TiptapEditor, pos: number): boolean {
  const node = editor.state.doc.nodeAt(pos);

  if (
    node === null ||
    !isMathNodeKind(node.type.name) ||
    node.attrs.kind === "chemistry"
  ) {
    return false;
  }

  return openFormulaDialogAt(editor, pos);
}

export function openSelectedMathDialog(editor: TiptapEditor): boolean {
  const session = createMathDialogSession(editor);
  return session.target === null
    ? false
    : openMathDialogAt(editor, session.target.pos);
}
