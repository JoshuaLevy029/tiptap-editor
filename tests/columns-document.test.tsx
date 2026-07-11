import { act, cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ApostilaEditor } from "../src/ApostilaEditor";
import { DocumentEditor } from "../src/DocumentEditor";
import { Editor } from "../src/Editor";
import type { EditorHandle } from "../src/types";

afterEach(cleanup);

describe("feature columns — estilo jornal", () => {
  it("envolve o bloco em colunas e serializa com column-count", async () => {
    const ref = createRef<EditorHandle>();

    render(<Editor defaultValue="<p>Texto corrido de exemplo</p>" ref={ref} />);
    await screen.findByRole("textbox");

    act(() => {
      ref.current
        ?.getEditor()
        ?.chain()
        .focus()
        .wrapIn("columns", { count: 2 })
        .run();
    });

    const html = (ref.current?.getHTML() ?? "").replaceAll(" ", "");
    expect(html).toContain('data-type="columns"');
    expect(html).toContain("column-count:2");
  });

  it("interpreta o formato div.cols do pipeline de apostilas", async () => {
    const ref = createRef<EditorHandle>();

    render(
      <Editor
        defaultValue='<div class="cols"><div class="col"><p>Coluna A</p></div><div class="col"><p>Coluna B</p></div></div>'
        ref={ref}
      />,
    );
    await screen.findByRole("textbox");

    const json = ref.current?.getJSON();
    const columns = json?.content?.find((node) => node.type === "columns");
    expect(columns).toBeTruthy();
    expect(columns?.attrs?.count).toBe(2);
  });
});

describe("DocumentEditor — visual de folha", () => {
  it("renderiza o controle de zoom junto da toolbar", async () => {
    render(<DocumentEditor defaultValue="<p>Página</p>" />);
    await screen.findByRole("textbox");

    expect(screen.getByRole("button", { name: "Aumentar zoom" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reduzir zoom" })).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Configuração da página" }),
    ).toBeTruthy();
  });
});

describe("ApostilaEditor — folha do pipeline", () => {
  it("tem zoom mas nao tem configuracao de pagina (formato fixo)", async () => {
    render(<ApostilaEditor defaultValue="<p>Página de apostila</p>" />);
    await screen.findByRole("textbox");

    expect(screen.getByRole("button", { name: "Aumentar zoom" })).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Configuração da página" }),
    ).toBeNull();
  });
});
