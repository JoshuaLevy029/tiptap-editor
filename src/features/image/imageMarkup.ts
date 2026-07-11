export type ImageAlign = "left" | "center" | "right";

export const MIN_IMAGE_WIDTH = 48;

export function clampImageWidth(width: number): number {
  return Math.max(MIN_IMAGE_WIDTH, Math.round(width));
}

export function parseImageAlign(value: unknown): ImageAlign {
  return value === "left" || value === "right" ? value : "center";
}

/** Margens que posicionam o bloco da imagem conforme o alinhamento. */
export function imageAlignStyle(align: ImageAlign): string {
  const marginLeft = align === "left" ? "0" : "auto";
  const marginRight = align === "right" ? "0" : "auto";

  return `display:block;margin-left:${marginLeft};margin-right:${marginRight};max-width:100%;`;
}

interface ParsedImageAttrs {
  align: ImageAlign;
  alt: string | null;
  caption: string | null;
  src: string;
  title: string | null;
  width: number | null;
}

function widthFromElement(img: HTMLElement): number | null {
  const raw = img.getAttribute("width");
  const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10);

  return Number.isNaN(parsed) ? null : clampImageWidth(parsed);
}

function attrsFromImg(
  img: HTMLElement,
  overrides: Partial<ParsedImageAttrs> = {},
): ParsedImageAttrs | false {
  const src = img.getAttribute("src");

  if (src === null || src.length === 0) {
    return false;
  }

  return {
    align: parseImageAlign(img.getAttribute("data-align")),
    alt: img.getAttribute("alt"),
    caption: null,
    src,
    title: img.getAttribute("title"),
    width: widthFromElement(img),
    ...overrides,
  };
}

export function imageAttrsFromElement(
  element: HTMLElement,
): ParsedImageAttrs | false {
  if (element.tagName.toLowerCase() === "img") {
    return attrsFromImg(element);
  }

  const img = element.querySelector("img");

  if (img === null) {
    return false;
  }

  const caption = element.querySelector("figcaption")?.textContent ?? null;
  const align = parseImageAlign(
    element.getAttribute("data-align") ?? img.getAttribute("data-align"),
  );

  return attrsFromImg(img, { align, caption });
}
