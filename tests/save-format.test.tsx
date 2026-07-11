import { act, cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "../src/Editor";
import type { EditorHandle } from "../src/types";

afterEach(cleanup);

async function insertText(ref: React.RefObject<EditorHandle | null>, text: string) {
  await screen.findByRole("textbox");
  act(() => {
    ref.current?.getEditor()?.chain().focus().insertContent(text).run();
  });
}

describe("saveAs — formato do state (SPEC 6)", () => {
  it("emite HTML por padrão no onChange", async () => {
    const ref = createRef<EditorHandle>();
    const values: string[] = [];

    render(<Editor onChange={(value) => values.push(value)} ref={ref} />);
    await insertText(ref, "Olá");

    const last = values.at(-1);
    expect(typeof last).toBe("string");
    expect(last).toContain("<p>");
    expect(last).toContain("Olá");
  });

  it('emite Markdown quando saveAs="markdown"', async () => {
    const ref = createRef<EditorHandle>();
    const values: string[] = [];

    render(
      <Editor
        onChange={(value) => values.push(value)}
        ref={ref}
        saveAs="markdown"
      />,
    );
    await insertText(ref, "Olá");

    const last = values.at(-1);
    expect(last).toBe("Olá");
    expect(last).not.toContain("<p>");
  });

  it("aceita defaultValue em HTML por padrão", async () => {
    render(<Editor defaultValue="<p>Conteúdo <strong>rico</strong></p>" />);

    const surface = await screen.findByRole("textbox");
    expect(surface.innerHTML).toContain("<strong>rico</strong>");
  });

  it('aceita defaultValue em Markdown quando saveAs="markdown"', async () => {
    render(<Editor defaultValue="Texto **forte**" saveAs="markdown" />);

    const surface = await screen.findByRole("textbox");
    expect(surface.innerHTML).toContain("<strong>forte</strong>");
  });
});
