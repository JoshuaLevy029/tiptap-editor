import { act, cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Editor } from "../src/Editor";
import {
  clampImageWidth,
  imageAlignStyle,
  parseImageAlign,
} from "../src/features/image/imageMarkup";
import type { EditorHandle } from "../src/types";

afterEach(cleanup);

describe("imageMarkup — helpers puros", () => {
  it("limita a largura mínima e arredonda", () => {
    expect(clampImageWidth(10)).toBe(48);
    expect(clampImageWidth(320.6)).toBe(321);
  });

  it("normaliza alinhamento desconhecido para center", () => {
    expect(parseImageAlign("left")).toBe("left");
    expect(parseImageAlign("x")).toBe("center");
    expect(parseImageAlign(undefined)).toBe("center");
  });

  it("gera margens conforme o alinhamento", () => {
    expect(imageAlignStyle("left")).toContain("margin-left:0");
    expect(imageAlignStyle("right")).toContain("margin-right:0");
    expect(imageAlignStyle("center")).toContain("margin-left:auto");
  });
});

describe("imagem — serialização com largura, alinhamento e legenda", () => {
  it("só abre os controles depois que a âncora da imagem existe", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const ref = createRef<EditorHandle>();

    try {
      render(<Editor ref={ref} />);
      await screen.findByRole("textbox");

      act(() => {
        ref.current
          ?.getEditor()
          ?.chain()
          .focus()
          .insertContent({
            attrs: { src: "https://example.com/ancora.png" },
            type: "image",
          })
          .run();
      });

      expect(
        await screen.findByRole("button", {
          name: "Editar texto alternativo",
        }),
      ).toBeTruthy();
      expect(consoleError.mock.calls.flat().join("\n")).not.toContain(
        "The `anchorEl` prop provided to the component is invalid",
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("emite figure/figcaption quando há legenda e faz round-trip", async () => {
    const ref = createRef<EditorHandle>();

    render(<Editor ref={ref} />);
    await screen.findByRole("textbox");

    act(() => {
      ref.current
        ?.getEditor()
        ?.chain()
        .focus()
        .insertContent({
          attrs: {
            align: "right",
            alt: "Gato",
            caption: "Figura 1 — um gato",
            src: "https://example.com/gato.png",
            width: 240,
          },
          type: "image",
        })
        .run();
    });

    const html = ref.current?.getHTML() ?? "";
    expect(html).toContain("<figure");
    expect(html).toContain("figcaption");
    expect(html).toContain("Figura 1 — um gato");
    expect(html).toContain('width="240"');
    expect(html).toContain('data-align="right"');

    // round-trip: HTML re-hidrata os mesmos atributos
    const ref2 = createRef<EditorHandle>();
    cleanup();
    render(<Editor defaultValue={html} ref={ref2} />);
    // a legenda também expõe role=textbox; basta aguardar qualquer um
    await screen.findAllByRole("textbox");

    const json = ref2.current?.getJSON();
    const imageNode = json?.content?.find((node) => node.type === "image");
    expect(imageNode?.attrs).toMatchObject({
      align: "right",
      caption: "Figura 1 — um gato",
      width: 240,
    });
  });

  it("emite img simples sem legenda, com margens de alinhamento", async () => {
    const ref = createRef<EditorHandle>();

    render(<Editor ref={ref} />);
    await screen.findByRole("textbox");

    act(() => {
      ref.current
        ?.getEditor()
        ?.chain()
        .focus()
        .insertContent({
          attrs: { src: "https://example.com/a.png" },
          type: "image",
        })
        .run();
    });

    const html = ref.current?.getHTML() ?? "";
    expect(html).not.toContain("<figure");
    expect(html.replaceAll(" ", "")).toContain("margin-left:auto");
  });
});
