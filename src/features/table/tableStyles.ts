/** Atributos de estilo de célula/tabela (Propriedades da célula/tabela). */

export const BORDER_STYLES = ["none", "solid", "dashed", "dotted"] as const;
export type TableBorderStyle = (typeof BORDER_STYLES)[number];

export interface BorderAttrs {
  borderColor: string | null;
  borderStyle: TableBorderStyle | null;
  borderWidth: string | null;
}

export interface CellStyleAttrs extends BorderAttrs {
  backgroundColor: string | null;
  height: string | null;
  padding: string | null;
  textAlign: "left" | "center" | "right" | "justify" | null;
  verticalAlign: "top" | "middle" | "bottom" | null;
}

export interface TableStyleAttrs extends BorderAttrs {
  align: "left" | "center" | "right" | null;
  backgroundColor: string | null;
  height: string | null;
}

/** "120" vira "120px"; "50%"/"1em" passam como estão; inválido vira null. */
export function normalizeCssSize(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return `${trimmed}px`;
  }

  return /^\d+(\.\d+)?(px|%|em|rem)$/.test(trimmed) ? trimmed : null;
}

export function buildBorderCss(attrs: BorderAttrs): string | null {
  if (
    attrs.borderStyle === null &&
    attrs.borderColor === null &&
    attrs.borderWidth === null
  ) {
    return null;
  }

  if (attrs.borderStyle === "none") {
    return "none";
  }

  const width = attrs.borderWidth ?? "1px";
  const style = attrs.borderStyle ?? "solid";

  return attrs.borderColor === null
    ? `${width} ${style}`
    : `${width} ${style} ${attrs.borderColor}`;
}

export function buildCellStyle(attrs: CellStyleAttrs): string | null {
  const parts: string[] = [];
  const border = buildBorderCss(attrs);

  if (attrs.backgroundColor !== null) {
    parts.push(`background-color:${attrs.backgroundColor}`);
  }
  if (border !== null) {
    parts.push(`border:${border}`);
  }
  if (attrs.height !== null) {
    parts.push(`height:${attrs.height}`);
  }
  if (attrs.padding !== null) {
    parts.push(`padding:${attrs.padding}`);
  }
  if (attrs.textAlign !== null) {
    parts.push(`text-align:${attrs.textAlign}`);
  }
  if (attrs.verticalAlign !== null) {
    parts.push(`vertical-align:${attrs.verticalAlign}`);
  }

  return parts.length === 0 ? null : `${parts.join(";")};`;
}

export function buildTableStyle(attrs: TableStyleAttrs): string | null {
  const parts: string[] = [];
  const border = buildBorderCss(attrs);

  if (attrs.backgroundColor !== null) {
    parts.push(`background-color:${attrs.backgroundColor}`);
  }
  if (border !== null) {
    parts.push(`border:${border}`);
  }
  if (attrs.height !== null) {
    parts.push(`min-height:${attrs.height}`);
  }
  if (attrs.align === "left") {
    parts.push("margin-right:auto");
  } else if (attrs.align === "right") {
    parts.push("margin-left:auto");
  } else if (attrs.align === "center") {
    parts.push("margin-left:auto;margin-right:auto");
  }

  return parts.length === 0 ? null : `${parts.join(";")};`;
}

const CELL_STYLE_KEYS: ReadonlyArray<keyof CellStyleAttrs> = [
  "backgroundColor",
  "borderColor",
  "borderStyle",
  "borderWidth",
  "height",
  "padding",
  "textAlign",
  "verticalAlign",
];

function isBorderStyle(value: string): value is TableBorderStyle {
  return (BORDER_STYLES as readonly string[]).includes(value);
}

export function parseCellStyle(element: HTMLElement): Partial<CellStyleAttrs> {
  const style = element.style;
  const attrs: Partial<CellStyleAttrs> = {};

  if (style.backgroundColor) {
    attrs.backgroundColor = style.backgroundColor;
  }
  if (style.borderStyle && isBorderStyle(style.borderStyle)) {
    attrs.borderStyle = style.borderStyle;
  }
  if (style.borderColor) {
    attrs.borderColor = style.borderColor;
  }
  if (style.borderWidth) {
    attrs.borderWidth = style.borderWidth;
  }
  if (style.height) {
    attrs.height = style.height;
  }
  if (style.padding) {
    attrs.padding = style.padding;
  }
  if (
    style.textAlign === "left" ||
    style.textAlign === "center" ||
    style.textAlign === "right" ||
    style.textAlign === "justify"
  ) {
    attrs.textAlign = style.textAlign;
  }
  if (
    style.verticalAlign === "top" ||
    style.verticalAlign === "middle" ||
    style.verticalAlign === "bottom"
  ) {
    attrs.verticalAlign = style.verticalAlign;
  }

  return attrs;
}

const TABLE_STYLE_KEYS: ReadonlyArray<keyof TableStyleAttrs> = [
  "align",
  "backgroundColor",
  "borderColor",
  "borderStyle",
  "borderWidth",
  "height",
];

export function parseTableStyle(
  element: HTMLElement,
): Partial<TableStyleAttrs> {
  const style = element.style;
  const attrs: Partial<TableStyleAttrs> = {};

  if (style.backgroundColor) {
    attrs.backgroundColor = style.backgroundColor;
  }
  if (style.borderStyle && isBorderStyle(style.borderStyle)) {
    attrs.borderStyle = style.borderStyle;
  }
  if (style.borderColor) {
    attrs.borderColor = style.borderColor;
  }
  if (style.borderWidth) {
    attrs.borderWidth = style.borderWidth;
  }
  if (style.minHeight) {
    attrs.height = style.minHeight;
  }

  const marginLeftAuto = style.marginLeft === "auto";
  const marginRightAuto = style.marginRight === "auto";

  if (marginLeftAuto && marginRightAuto) {
    attrs.align = "center";
  } else if (marginLeftAuto) {
    attrs.align = "right";
  } else if (marginRightAuto) {
    attrs.align = "left";
  }

  return attrs;
}

/** Declarações de atributo Tiptap para os estilos da tabela (render agregado no style). */
export function tableStyleAttributeDefs(): Record<
  string,
  {
    default: null;
    renderHTML: (attrs: Record<string, unknown>) => Record<string, string>;
    parseHTML: (element: HTMLElement) => unknown;
  }
> {
  const defs: Record<
    string,
    {
      default: null;
      renderHTML: (attrs: Record<string, unknown>) => Record<string, string>;
      parseHTML: (element: HTMLElement) => unknown;
    }
  > = {};

  for (const key of TABLE_STYLE_KEYS) {
    defs[key] = {
      default: null,
      parseHTML: (element) => parseTableStyle(element)[key] ?? null,
      renderHTML:
        key === TABLE_STYLE_KEYS[0]
          ? (attrs) => {
              const style = buildTableStyle(
                attrs as unknown as TableStyleAttrs,
              );
              return style === null ? {} : { style };
            }
          : () => ({}),
    };
  }

  return defs;
}

/** Declarações de atributo Tiptap para os estilos de célula (render agregado no style). */
export function cellStyleAttributeDefs(): Record<
  string,
  { default: null; renderHTML: (attrs: Record<string, unknown>) => Record<string, string> ; parseHTML: (element: HTMLElement) => unknown }
> {
  const defs: Record<string, {
    default: null;
    renderHTML: (attrs: Record<string, unknown>) => Record<string, string>;
    parseHTML: (element: HTMLElement) => unknown;
  }> = {};

  for (const key of CELL_STYLE_KEYS) {
    defs[key] = {
      default: null,
      parseHTML: (element) => parseCellStyle(element)[key] ?? null,
      // O style completo é emitido apenas uma vez (na primeira chave).
      renderHTML:
        key === CELL_STYLE_KEYS[0]
          ? (attrs) => {
              const style = buildCellStyle(attrs as unknown as CellStyleAttrs);
              return style === null ? {} : { style };
            }
          : () => ({}),
    };
  }

  return defs;
}
