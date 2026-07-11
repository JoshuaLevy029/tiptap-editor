import StarterKit from "@tiptap/starter-kit";
import { Editor as TiptapEditor } from "@tiptap/react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import ImageDialog from "../src/features/image/ImageDialog";
import { imageFeature } from "../src/features/image";
import { resolveImageConfig } from "../src/features/image/helpers";

afterEach(cleanup);

function createEditor(): TiptapEditor {
  const config = imageFeature.resolveConfig(true);

  if (config === null) {
    throw new Error("A feature image deve estar ativa nos testes.");
  }

  return new TiptapEditor({
    content: { content: [{ type: "paragraph" }], type: "doc" },
    extensions: [StarterKit, ...imageFeature.extensions(config)],
  });
}

describe("ImageDialog — palco único com URL e arquivo", () => {
  it("mostra o palco, o campo de URL e o botão Procurar", () => {
    const editor = createEditor();

    render(
      <ImageDialog
        config={resolveImageConfig({})}
        editor={editor}
        onClose={() => {}}
        open
      />,
    );

    expect(
      screen.getByText("A imagem aparece aqui — solte um arquivo neste palco"),
    ).toBeTruthy();
    expect(screen.getByLabelText("URL da imagem")).toBeTruthy();
    expect(screen.getByText("Procurar…")).toBeTruthy();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);

    editor.destroy();
  });

  it("habilita Confirmar ao digitar URL válida e insere a imagem", async () => {
    const user = userEvent.setup();
    const editor = createEditor();
    let closed = false;

    render(
      <ImageDialog
        config={resolveImageConfig({})}
        editor={editor}
        onClose={() => {
          closed = true;
        }}
        open
      />,
    );

    const confirm = screen.getByRole("button", { name: "Confirmar" });
    expect(confirm.hasAttribute("disabled")).toBe(true);

    await user.type(
      screen.getByLabelText("URL da imagem"),
      "https://example.com/foto.png",
    );
    expect(confirm.hasAttribute("disabled")).toBe(false);

    await user.click(confirm);

    expect(closed).toBe(true);
    let src: unknown;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "image") {
        src = node.attrs.src;
      }
    });
    expect(src).toBe("https://example.com/foto.png");

    editor.destroy();
  });
});
