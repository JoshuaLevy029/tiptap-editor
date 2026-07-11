import StarterKit from "@tiptap/starter-kit";
import { Editor as TiptapEditor } from "@tiptap/react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import SpecialCharactersDialog from "../src/features/specialCharacters/SpecialCharactersDialog";
import { resolveSpecialCharacterSets } from "../src/features/specialCharacters/helpers";

afterEach(cleanup);

function createEditor(): TiptapEditor {
  return new TiptapEditor({
    content: { content: [{ type: "paragraph" }], type: "doc" },
    extensions: [StarterKit],
  });
}

const SETS = resolveSpecialCharacterSets(undefined);

describe("SpecialCharactersDialog — busca, categorias e inserção contínua", () => {
  it("mostra as categorias padrão e filtra pela busca", async () => {
    const user = userEvent.setup();
    const editor = createEditor();

    render(
      <SpecialCharactersDialog
        editor={editor}
        onClose={() => {}}
        open
        sets={SETS}
      />,
    );

    expect(screen.getByText("Grego")).toBeTruthy();
    expect(screen.getByText("Conjuntos")).toBeTruthy();
    expect(screen.getByText("Setas")).toBeTruthy();

    await user.type(screen.getByLabelText("Buscar caracteres"), "grego");

    expect(screen.getByText("Grego")).toBeTruthy();
    expect(screen.queryByText("Setas")).toBeNull();

    editor.destroy();
  });

  it("insere sem fechar e mostra o último caractere inserido", async () => {
    const user = userEvent.setup();
    const editor = createEditor();
    let closed = false;

    render(
      <SpecialCharactersDialog
        editor={editor}
        onClose={() => {
          closed = true;
        }}
        open
        sets={SETS}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Inserir ζ" }));
    await user.click(screen.getByRole("button", { name: "Inserir π" }));

    expect(closed).toBe(false);
    expect(editor.getText()).toContain("ζπ");
    // rodapé "Inserido: π" (o π do chip também existe, por isso getAllByText)
    expect(screen.getByText("Inserido:")).toBeTruthy();
    expect(screen.getAllByText("π").length).toBeGreaterThanOrEqual(2);

    editor.destroy();
  });
});
