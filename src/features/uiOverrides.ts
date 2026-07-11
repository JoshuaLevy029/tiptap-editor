import type { ToolbarIcon, ToolbarItemSpec } from "./types";

/** Customização de UI de um item da toolbar (SPEC 7.1.4). */
export interface ToolbarItemOverride {
  /** Remove o item da toolbar (a feature continua ativa: atalhos, parse, HTML). */
  hidden?: boolean;
  /** Oculta opções de menu pelo `value` (ex.: tipos de numeração indesejados). */
  hideOptions?: string[];
  /** Substitui o ícone: nome Iconify ou ReactNode. */
  icon?: ToolbarIcon;
  /** Substitui o tooltip/nome acessível do item. */
  tooltip?: string;
}

/**
 * Overrides de UI keyed pelo `key` do item da toolbar (na prática, a chave da
 * feature: "bold", "textType", "orderedList"…).
 */
export type EditorUiOverrides = Readonly<
  Partial<Record<string, ToolbarItemOverride>>
>;

/** Aplica os overrides às specs sem mutá-las (itens ocultos são removidos). */
export function applyUiOverrides(
  items: readonly ToolbarItemSpec[],
  overrides: EditorUiOverrides | undefined,
): ToolbarItemSpec[] {
  if (overrides === undefined) {
    return [...items];
  }

  const result: ToolbarItemSpec[] = [];

  for (const item of items) {
    const override = overrides[item.key];

    if (override === undefined) {
      result.push(item);
      continue;
    }

    if (override.hidden === true) {
      continue;
    }

    let next: ToolbarItemSpec = {
      ...item,
      ...(override.icon !== undefined && "icon" in item
        ? { icon: override.icon }
        : {}),
      ...(override.tooltip !== undefined ? { label: override.tooltip } : {}),
    };

    if (
      next.type === "menu" &&
      override.hideOptions !== undefined &&
      override.hideOptions.length > 0
    ) {
      const hide = new Set(override.hideOptions);
      next = {
        ...next,
        options: next.options.filter((option) => !hide.has(option.value)),
      };
    }

    result.push(next);
  }

  return result;
}
