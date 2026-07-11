import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "../src/Editor";
import { applyUiOverrides } from "../src/features/uiOverrides";
import type { ToolbarItemSpec } from "../src/features";

afterEach(cleanup);

const noop = () => {};
const SAMPLE_ITEMS: ToolbarItemSpec[] = [
  {
    type: "toggle",
    key: "bold",
    label: "Negrito",
    icon: "lucide:bold",
    isActive: () => false,
    onClick: noop,
  },
  {
    type: "menu",
    key: "orderedList",
    label: "Lista numerada",
    icon: "lucide:list-ordered",
    options: [
      { label: "Numérica", value: "1" },
      { label: "Romana", value: "I" },
      { label: "Remover", value: "" },
    ],
    getValue: () => "",
    onChange: noop,
  },
];

describe("applyUiOverrides — função pura", () => {
  it("substitui ícone e tooltip sem mutar a spec original", () => {
    const result = applyUiOverrides(SAMPLE_ITEMS, {
      bold: { icon: "mdi:format-bold", tooltip: "Negrito (Ctrl+B)" },
    });

    expect(result[0]).toMatchObject({
      icon: "mdi:format-bold",
      label: "Negrito (Ctrl+B)",
    });
    expect(SAMPLE_ITEMS[0]).toMatchObject({
      icon: "lucide:bold",
      label: "Negrito",
    });
  });

  it("oculta itens e opções de menu", () => {
    const result = applyUiOverrides(SAMPLE_ITEMS, {
      bold: { hidden: true },
      orderedList: { hideOptions: ["I"] },
    });

    expect(result).toHaveLength(1);
    const menu = result[0];
    expect(menu?.type).toBe("menu");
    if (menu?.type === "menu") {
      expect(menu.options.map((option) => option.value)).toEqual(["1", ""]);
    }
  });

  it("sem overrides devolve os itens intactos", () => {
    expect(applyUiOverrides(SAMPLE_ITEMS, undefined)).toEqual(SAMPLE_ITEMS);
  });
});

describe("prop ui no Editor", () => {
  it("aplica tooltip custom, ReactNode como ícone e oculta item", async () => {
    render(
      <Editor
        ui={{
          bold: {
            icon: <span data-testid="custom-bold-icon">B!</span>,
            tooltip: "Negritão",
          },
          italic: { hidden: true },
        }}
      />,
    );
    const toolbar = await screen.findByRole("toolbar", {
      name: "Formatação do editor",
    });

    const bold = within(toolbar).getByRole("button", { name: "Negritão" });
    expect(within(bold).getByTestId("custom-bold-icon")).toBeTruthy();
    expect(
      within(toolbar).queryByRole("button", { name: "Itálico" }),
    ).toBeNull();
  });

  it("oculta opções do menu de lista numerada", async () => {
    const user = userEvent.setup();

    render(
      <Editor ui={{ orderedList: { hideOptions: ["I", "i"] } }} />,
    );
    const toolbar = await screen.findByRole("toolbar", {
      name: "Formatação do editor",
    });

    await user.click(
      within(toolbar).getByRole("button", { name: "Lista numerada" }),
    );
    const menu = await screen.findByRole("menu");
    const labels = within(menu)
      .getAllByRole("menuitem")
      .map((item) => item.getAttribute("aria-label"));

    expect(labels).not.toContain("Romana minúscula (i)");
    expect(labels).not.toContain("Romana maiúscula (I)");
    expect(labels).toContain("Numérica (1)");
  });
});
