import StarterKit from "@tiptap/starter-kit";
import { Editor as TiptapEditor } from "@tiptap/react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import MathDialog from "../src/features/math/MathDialog";
import { mathFeature } from "../src/features/math";

vi.mock("mathlive", () => ({}));
vi.mock("../src/features/math/mathlive", () => ({
  getMathfield: () => null,
  getMathVirtualKeyboard: () => undefined,
}));

afterEach(cleanup);

function createEditor(): TiptapEditor {
  const config = mathFeature.resolveConfig(true);

  if (config === null) {
    throw new Error("A feature math deve estar ativa nos testes.");
  }

  return new TiptapEditor({
    content: { content: [{ type: "paragraph" }], type: "doc" },
    extensions: [StarterKit, ...mathFeature.extensions(config)],
  });
}

describe("MathDialog — alternância Em linha/Em bloco", () => {
  it("permite trocar o tipo para 'Em bloco' em fórmula nova", async () => {
    const user = userEvent.setup();
    const editor = createEditor();

    render(<MathDialog editor={editor} onClose={() => {}} open />);

    const inline = screen.getByRole("button", { name: "Em linha" });
    const block = screen.getByRole("button", { name: "Em bloco" });

    expect(inline.getAttribute("aria-pressed")).toBe("true");
    expect(block.getAttribute("aria-pressed")).toBe("false");

    await user.click(block);

    expect(
      screen.getByRole("button", { name: "Em bloco" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Em linha" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");

    editor.destroy();
  });

  it("confirmar com 'Em bloco' insere node blockMath no documento", async () => {
    const user = userEvent.setup();
    const editor = createEditor();

    render(<MathDialog editor={editor} onClose={() => {}} open />);

    await user.click(screen.getByRole("button", { name: "Em bloco" }));
    await user.type(screen.getByLabelText("Código LaTeX"), "x^2");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    const nodes: string[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "inlineMath" || node.type.name === "blockMath") {
        nodes.push(node.type.name);
      }
    });

    expect(nodes).toEqual(["blockMath"]);

    editor.destroy();
  });
});
