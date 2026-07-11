import type { BulletListFeatureConfig } from "../../types";

export type BulletListStyle = NonNullable<
  BulletListFeatureConfig["styles"]
>[number];

export const DEFAULT_BULLET_LIST_STYLES = ["disc", "dash"] as const;

const DASH_MARKER = "–";

export function getBulletListStyles(
  config: BulletListFeatureConfig,
): readonly BulletListStyle[] {
  return config.styles?.length ? config.styles : DEFAULT_BULLET_LIST_STYLES;
}

export function isBulletListStyle(value: unknown): value is BulletListStyle {
  return value === "disc" || value === "dash";
}

export function readBulletListStyle(
  value: unknown,
  fallback: BulletListStyle,
): BulletListStyle {
  return isBulletListStyle(value) ? value : fallback;
}

export function parseBulletListStyle(
  element: HTMLElement,
  fallback: BulletListStyle,
): BulletListStyle {
  const value = element.style.listStyleType.trim();

  if (value === "disc") {
    return "disc";
  }

  if (value === "dash" || value.includes(DASH_MARKER)) {
    return "dash";
  }

  return fallback;
}

export function toCssListStyleType(style: BulletListStyle): string {
  return style === "dash" ? `"${DASH_MARKER}"` : "disc";
}

export function getBulletListStyleLabel(style: BulletListStyle): string {
  return style === "dash" ? "Traço" : "Disco";
}

export function getBulletListStyleMarkers(
  style: BulletListStyle,
): readonly string[] {
  return style === "dash" ? ["–", "–", "–"] : ["•", "•", "•"];
}
