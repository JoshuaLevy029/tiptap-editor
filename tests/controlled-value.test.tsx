import { act, cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "../src/Editor";
import type { EditorHandle } from "../src/types";

afterEach(cleanup);

describe("modo controlado — prop value (SPEC 6.1)", () => {
  it("aplica o value inicial e mudanças externas", async () => {
    const { rerender } = render(<Editor value="<p>primeiro</p>" />);

    const surface = await screen.findByRole("textbox");
    expect(surface.textContent).toContain("primeiro");

    rerender(<Editor value="<p>segundo</p>" />);
    expect(surface.textContent).toContain("segundo");
    expect(surface.textContent).not.toContain("primeiro");
  });

  it("ignora o eco do onChange sem resetar o documento", async () => {
    const ref = createRef<EditorHandle>();
    let latest = "<p>base</p>";
    const { rerender } = render(
      <Editor
        onChange={(v) => {
          latest = v;
        }}
        ref={ref}
        value={latest}
      />,
    );

    await screen.findByRole("textbox");
    act(() => {
      ref.current?.getEditor()?.chain().focus("end").insertContent(" digitado").run();
    });

    // pai ecoa o valor emitido, como faria com useState
    rerender(<Editor onChange={(v) => (latest = v)} ref={ref} value={latest} />);

    expect(ref.current?.getHTML()).toContain("digitado");
    expect(ref.current?.getHTML()).toContain("base");
  });
});
