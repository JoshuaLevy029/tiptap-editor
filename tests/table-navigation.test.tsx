import { act, cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "../src/Editor";
import type { EditorHandle } from "../src/types";

afterEach(cleanup);

describe("navegação para fora da tabela (cursor preso)", () => {
  it("inserir tabela no fim do documento gera parágrafo posterior (trailingNode)", async () => {
    const ref = createRef<EditorHandle>();

    render(<Editor ref={ref} />);
    await screen.findByRole("textbox");

    act(() => {
      ref.current
        ?.getEditor()
        ?.chain()
        .focus()
        .insertTable({ cols: 2, rows: 2, withHeaderRow: true })
        .run();
    });

    const doc = ref.current?.getEditor()?.state.doc;
    const childNames: string[] = [];
    doc?.forEach((node) => childNames.push(node.type.name));

    expect(childNames).toContain("table");
    expect(doc?.lastChild?.type.name).toBe("paragraph");
  });

  it("tabela inserida nasce com todas as colunas de largura fixa", async () => {
    const { insertResizableTable } = await import(
      "../src/features/table/helpers"
    );
    const ref = createRef<EditorHandle>();

    render(<Editor ref={ref} />);
    await screen.findByRole("textbox");

    act(() => {
      const editor = ref.current?.getEditor();
      if (editor) {
        insertResizableTable(editor, {
          cols: 3,
          rows: 2,
          withHeaderRow: true,
        });
      }
    });

    const doc = ref.current?.getEditor()?.state.doc;
    const widths: unknown[] = [];
    doc?.descendants((node) => {
      if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
        widths.push(node.attrs.colwidth);
        return false;
      }
      return true;
    });

    expect(widths).toHaveLength(6);
    for (const width of widths) {
      expect(Array.isArray(width)).toBe(true);
      expect((width as number[])[0]).toBeGreaterThanOrEqual(50);
    }
  });

  it("gapcursor e trailingNode estão registrados no editor", async () => {
    const ref = createRef<EditorHandle>();

    render(<Editor ref={ref} />);
    await screen.findByRole("textbox");

    const names =
      ref.current
        ?.getEditor()
        ?.extensionManager.extensions.map((extension) => extension.name) ?? [];
    expect(names).toContain("gapCursor");
    expect(names).toContain("trailingNode");
  });
});
