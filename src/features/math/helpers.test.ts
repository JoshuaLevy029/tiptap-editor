import StarterKit from "@tiptap/starter-kit";
import { Editor as TiptapEditor, type JSONContent } from "@tiptap/react";
import { describe, expect, it } from "vitest";
import { mathFeature } from "./index";
import {
  commitMathDialog,
  createMathDialogSession,
  isFaithfulMathLiveRoundTrip,
  renderLatexPreview,
  type MathNodeKind,
} from "./helpers";

interface MathNodeSnapshot {
  readonly kind: MathNodeKind;
  readonly latex: string;
  readonly pos: number;
}

function createEditor(content: JSONContent): TiptapEditor {
  const config = mathFeature.resolveConfig(true);

  if (config === null) {
    throw new Error("A feature math deve estar ativa nos testes.");
  }

  return new TiptapEditor({
    content,
    extensions: [StarterKit, ...mathFeature.extensions(config)],
  });
}

function readMathNodes(editor: TiptapEditor): MathNodeSnapshot[] {
  const nodes: MathNodeSnapshot[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== "inlineMath" && node.type.name !== "blockMath") {
      return;
    }

    nodes.push({
      kind: node.type.name,
      latex: typeof node.attrs.latex === "string" ? node.attrs.latex : "",
      pos,
    });
  });

  return nodes;
}

describe("mathFeature", () => {
  it("resolve false como null e true/undefined como defaults independentes", () => {
    expect(mathFeature.resolveConfig(false)).toBeNull();

    const first = mathFeature.resolveConfig(true);
    const second = mathFeature.resolveConfig(undefined);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first?.keyboardLayouts).not.toBe(second?.keyboardLayouts);
    expect(mathFeature.toolbarItems(first ?? {}).at(0)).toMatchObject({
      icon: "lucide:sigma",
      key: "math",
      type: "dialog",
    });
  });

  it("P1: edita fórmulas no início, meio e fim no mesmo node e posição", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "inlineMath", attrs: { latex: "a" } },
            { type: "text", text: " início " },
            { type: "inlineMath", attrs: { latex: "b" } },
            { type: "text", text: " fim " },
            { type: "inlineMath", attrs: { latex: "c" } },
          ],
        },
      ],
    });
    const originalPositions = readMathNodes(editor).map(({ pos }) => pos);

    for (const [index, pos] of originalPositions.entries()) {
      editor.commands.setNodeSelection(pos);
      const session = createMathDialogSession(editor);

      expect(
        commitMathDialog(editor, session, "blockMath", `edit-${index}`),
      ).toBe("updated");
      expect(readMathNodes(editor)).toHaveLength(3);
      expect(readMathNodes(editor).map((node) => node.pos)).toEqual(
        originalPositions,
      );
      expect(readMathNodes(editor)[index]).toMatchObject({
        kind: "inlineMath",
        latex: `edit-${index}`,
        pos,
      });
    }

    editor.destroy();
  });

  it("P1: insere na posição do cursor e substitui somente a seleção", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "abcd" }] },
      ],
    });

    editor.commands.setTextSelection({ from: 2, to: 4 });
    const session = createMathDialogSession(editor);

    expect(commitMathDialog(editor, session, "inlineMath", "x")).toBe(
      "inserted",
    );
    expect(editor.getJSON()).toMatchObject({
      content: [
        {
          content: [
            { text: "a", type: "text" },
            { attrs: { latex: "x" }, type: "inlineMath" },
            { text: "d", type: "text" },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    });

    editor.destroy();
  });

  it("P1: não cria outro node quando o alvo original fica obsoleto", () => {
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "inlineMath", attrs: { latex: "original" } }],
        },
      ],
    });
    const [target] = readMathNodes(editor);

    if (target === undefined) {
      throw new Error("Node de teste ausente.");
    }

    editor.commands.setNodeSelection(target.pos);
    const session = createMathDialogSession(editor);
    editor.commands.deleteSelection();

    expect(commitMathDialog(editor, session, "inlineMath", "alterada")).toBe(
      "stale",
    );
    expect(readMathNodes(editor)).toHaveLength(0);
    editor.destroy();
  });

  it("P3: confirmar sem editar preserva o LaTeX byte a byte", () => {
    const original = String.raw`  \operatorname {sen}\!\left(x\right)  `;
    const editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "inlineMath", attrs: { latex: original } }],
        },
      ],
    });
    const [target] = readMathNodes(editor);

    if (target === undefined) {
      throw new Error("Node de teste ausente.");
    }

    editor.commands.setNodeSelection(target.pos);
    const session = createMathDialogSession(editor);
    const before = JSON.stringify(editor.getJSON());

    expect(commitMathDialog(editor, session, "inlineMath", original)).toBe(
      "unchanged",
    );
    expect(JSON.stringify(editor.getJSON())).toBe(before);
    expect(readMathNodes(editor)[0]?.latex).toBe(original);
    editor.destroy();
  });

  it("P3: detecta qualquer normalização feita no round-trip visual", () => {
    expect(
      isFaithfulMathLiveRoundTrip(
        String.raw`\frac {1}{2}`,
        String.raw`\frac{1}{2}`,
      ),
    ).toBe(false);
    expect(
      isFaithfulMathLiveRoundTrip(
        String.raw`\frac {1}{2}`,
        String.raw`\frac {1}{2}`,
      ),
    ).toBe(true);
  });

  it("preserva o código cru quando o KaTeX não consegue renderizar", () => {
    const latex = String.raw`\comandoInexistente{conteúdo`;
    const preview = renderLatexPreview(latex, false);

    expect(preview.html).toBeNull();
    expect(preview.error).toEqual(expect.any(String));
    expect(latex).toBe(String.raw`\comandoInexistente{conteúdo`);
  });
});
