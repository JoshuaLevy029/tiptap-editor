import { act, cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "../src/Editor";
import { insertResizableTable } from "../src/features/table/helpers";
import {
  canMergeTowards,
  hasHeaderRow,
  mergeTowards,
} from "../src/features/table/tableCommands";
import type { EditorHandle } from "../src/types";

afterEach(cleanup);

async function renderEditorWithTable(ref: React.RefObject<EditorHandle | null>) {
  render(<Editor ref={ref} />);
  await screen.findByRole("textbox");

  act(() => {
    const editor = ref.current?.getEditor();
    if (editor) {
      insertResizableTable(editor, { cols: 2, rows: 2, withHeaderRow: true });
    }
  });
}

describe("balloon da tabela", () => {
  it("aparece quando a seleção está dentro da tabela", async () => {
    const ref = createRef<EditorHandle>();
    await renderEditorWithTable(ref);

    expect(await screen.findByRole("button", { name: "Coluna" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Linha" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mesclar células" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Propriedades da célula" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Propriedades da tabela" }),
    ).toBeTruthy();
  });

  it("não aparece fora da tabela", async () => {
    render(<Editor />);
    await screen.findByRole("textbox");

    expect(screen.queryByRole("button", { name: "Coluna" })).toBeNull();
  });
});

describe("comandos de tabela", () => {
  it("detecta linha de cabeçalho e limites de mesclagem", async () => {
    const ref = createRef<EditorHandle>();
    await renderEditorWithTable(ref);

    const editor = ref.current?.getEditor();
    if (!editor) {
      throw new Error("editor ausente");
    }

    // seleção está na primeira célula (header) após inserir
    expect(hasHeaderRow(editor.state)).toBe(true);
    expect(canMergeTowards(editor.state, "up")).toBe(false);
    expect(canMergeTowards(editor.state, "left")).toBe(false);
    expect(canMergeTowards(editor.state, "right")).toBe(true);
  });

  it("mescla à direita gerando colspan 2", async () => {
    const ref = createRef<EditorHandle>();
    await renderEditorWithTable(ref);

    const editor = ref.current?.getEditor();
    if (!editor) {
      throw new Error("editor ausente");
    }

    act(() => {
      expect(mergeTowards(editor, "right")).toBe(true);
    });

    let merged = false;
    editor.state.doc.descendants((node) => {
      if (
        (node.type.name === "tableHeader" || node.type.name === "tableCell") &&
        node.attrs.colspan === 2
      ) {
        merged = true;
      }
    });
    expect(merged).toBe(true);
  });

  it("atributos de estilo da célula sobrevivem ao round-trip de HTML", async () => {
    const ref = createRef<EditorHandle>();
    await renderEditorWithTable(ref);

    const editor = ref.current?.getEditor();
    if (!editor) {
      throw new Error("editor ausente");
    }

    act(() => {
      editor
        .chain()
        .focus()
        .setCellAttribute("backgroundColor", "rgb(255, 245, 157)")
        .setCellAttribute("textAlign", "center")
        .run();
    });

    const html = ref.current?.getHTML() ?? "";
    const compact = html.replaceAll(" ", "");
    expect(compact).toContain("background-color:rgb(255,245,157)");
    expect(compact).toContain("text-align:center");

    cleanup();
    const ref2 = createRef<EditorHandle>();
    render(<Editor defaultValue={html} ref={ref2} />);
    await screen.findByRole("textbox");

    let found = false;
    ref2.current?.getEditor()?.state.doc.descendants((node) => {
      if (
        node.type.name === "tableHeader" &&
        node.attrs.backgroundColor === "rgb(255, 245, 157)" &&
        node.attrs.textAlign === "center"
      ) {
        found = true;
      }
    });
    expect(found).toBe(true);
  });
});
