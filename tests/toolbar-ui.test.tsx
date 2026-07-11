import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "../src/Editor";

afterEach(cleanup);

async function renderFullToolbar() {
  render(<Editor />);
  return screen.findByRole("toolbar", { name: "Formatação do editor" });
}

describe("toolbar — SPEC 5.1 (IconButtons, sem Select)", () => {
  it("não renderiza nenhum Select/combobox na toolbar", async () => {
    const toolbar = await renderFullToolbar();

    expect(within(toolbar).queryAllByRole("combobox")).toHaveLength(0);
  });

  it("tipo de texto é IconButton que abre menu com Parágrafo e títulos", async () => {
    const user = userEvent.setup();
    const toolbar = await renderFullToolbar();

    const button = within(toolbar).getByRole("button", {
      name: "Tipo de texto",
    });
    expect(button.getAttribute("aria-haspopup")).toBe("menu");

    await user.click(button);

    const menu = await screen.findByRole("menu");
    expect(
      within(menu).getByRole("menuitem", { name: "Parágrafo" }),
    ).toBeTruthy();
    expect(
      within(menu).getByRole("menuitem", { name: "Título 1" }),
    ).toBeTruthy();
  });

  it("listas são um único botão com menu de estilos", async () => {
    const user = userEvent.setup();
    const toolbar = await renderFullToolbar();

    await user.click(
      within(toolbar).getByRole("button", { name: "Lista numerada" }),
    );

    const menu = await screen.findByRole("menu");
    const labels = within(menu)
      .getAllByRole("menuitem")
      .map((item) => item.textContent);
    expect(labels).toContain("Remover lista");
    expect(labels.length).toBeGreaterThan(2);
  });

  it("cor do texto abre popover com paleta e indicador de cor no ícone", async () => {
    const user = userEvent.setup();
    const toolbar = await renderFullToolbar();

    expect(screen.getByTestId("textColor-indicator")).toBeTruthy();

    await user.click(
      within(toolbar).getByRole("button", { name: "Cor do texto" }),
    );

    const palette = await screen.findByRole("listbox", {
      name: "Cor do texto",
    });
    expect(within(palette).getAllByRole("option").length).toBeGreaterThan(5);
    expect(
      screen.getByRole("button", { name: "Cor automática" }),
    ).toBeTruthy();
  });

  it("marca-texto usa popover de paleta com swatches", async () => {
    const user = userEvent.setup();
    const toolbar = await renderFullToolbar();

    await user.click(
      within(toolbar).getByRole("button", { name: "Marca-texto" }),
    );

    const palette = await screen.findByRole("listbox", {
      name: "Marca-texto",
    });
    expect(within(palette).getAllByRole("option").length).toBeGreaterThan(3);
  });
});
