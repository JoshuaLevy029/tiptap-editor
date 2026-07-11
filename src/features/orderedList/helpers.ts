import type { OrderedListFeatureConfig } from "../../types";

export type OrderedListType = NonNullable<
  OrderedListFeatureConfig["types"]
>[number];

export const DEFAULT_ORDERED_LIST_TYPES = ["1", "a", "A", "i", "I"] as const;

const TYPE_LABELS: Readonly<Record<OrderedListType, string>> = {
  "1": "Numérica (1)",
  a: "Alfabética minúscula (a)",
  A: "Alfabética maiúscula (A)",
  i: "Romana minúscula (i)",
  I: "Romana maiúscula (I)",
};

export function getOrderedListTypes(
  config: OrderedListFeatureConfig,
): readonly OrderedListType[] {
  return config.types?.length ? config.types : DEFAULT_ORDERED_LIST_TYPES;
}

export function isOrderedListType(value: unknown): value is OrderedListType {
  return DEFAULT_ORDERED_LIST_TYPES.some((type) => type === value);
}

export function readOrderedListType(
  value: unknown,
  fallback: OrderedListType,
): OrderedListType {
  return isOrderedListType(value) ? value : fallback;
}

export function getOrderedListTypeLabel(type: OrderedListType): string {
  return TYPE_LABELS[type];
}

const TYPE_MARKERS: Readonly<Record<OrderedListType, readonly string[]>> = {
  "1": ["1.", "2.", "3."],
  a: ["a.", "b.", "c."],
  A: ["A.", "B.", "C."],
  i: ["i.", "ii.", "iii."],
  I: ["I.", "II.", "III."],
};

export function getOrderedListTypeMarkers(
  type: OrderedListType,
): readonly string[] {
  return TYPE_MARKERS[type];
}
