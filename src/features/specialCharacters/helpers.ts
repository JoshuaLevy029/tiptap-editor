export interface SpecialCharacter {
  readonly label: string;
  readonly value: string;
}

export interface SpecialCharacterSet {
  readonly characters: readonly SpecialCharacter[];
  readonly label: string;
}

function charSet(label: string, characters: string): SpecialCharacterSet {
  return {
    characters: Array.from(characters).map((value) => ({
      label: value,
      value,
    })),
    label,
  };
}

const DEFAULT_SETS: readonly SpecialCharacterSet[] = [
  charSet("Pontuação", "–—…«»“”‘’·•§¶†‡¡¿´″"),
  charSet("Matemática", "±×÷·≠≈≡≤≥∞°√∑∏∫∂∆∇∝∴∠⊥∥‰"),
  charSet(
    "Grego",
    "αβγδεζηθικλμνξοπρςστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ",
  ),
  charSet(
    "Latim",
    "àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝŒœŠšŽžßðþ",
  ),
  charSet("Conjuntos", "∈∉⊂⊃⊆⊇∪∩∅∧∨¬∀∃ℕℤℚℝℂ"),
  charSet("Setas", "←→↑↓↔↕⇐⇒⇔↦↗↘"),
  charSet("Sobre/Subscrito", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ₀₁₂₃₄₅₆₇₈₉₊₋"),
  charSet("Moedas e unidades", "€£¥¢₩฿µÅΩ№"),
  charSet("Frações e diversos", "½⅓⅔¼¾⅛©®™✓✗★☆"),
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeCharacter(value: unknown): SpecialCharacter | null {
  if (typeof value === "string" && value.length > 0) {
    return { label: value, value };
  }

  if (
    !isRecord(value) ||
    typeof value.value !== "string" ||
    value.value.length === 0
  ) {
    return null;
  }

  return {
    label: typeof value.label === "string" ? value.label : value.value,
    value: value.value,
  };
}

function normalizeCharacters(value: unknown): readonly SpecialCharacter[] {
  const values = typeof value === "string" ? Array.from(value) : value;

  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((character) => normalizeCharacter(character))
    .filter((character): character is SpecialCharacter => character !== null);
}

function normalizeArraySets(
  value: readonly unknown[],
): readonly SpecialCharacterSet[] {
  return value.flatMap((candidate, index) => {
    if (!isRecord(candidate)) {
      return [];
    }

    const characters = normalizeCharacters(
      candidate.characters ?? candidate.values,
    );

    if (characters.length === 0) {
      return [];
    }

    const labelCandidate =
      candidate.label ?? candidate.name ?? candidate.category;
    const label =
      typeof labelCandidate === "string"
        ? labelCandidate
        : `Categoria ${index + 1}`;

    return [{ label, characters }];
  });
}

function normalizeRecordSets(
  value: Record<string, unknown>,
): readonly SpecialCharacterSet[] {
  return Object.entries(value).flatMap(([label, rawCharacters]) => {
    const characters = normalizeCharacters(rawCharacters);
    return characters.length > 0 ? [{ label, characters }] : [];
  });
}

function cloneDefaultSets(): readonly SpecialCharacterSet[] {
  return DEFAULT_SETS.map((set) => ({
    label: set.label,
    characters: set.characters.map((character) => ({ ...character })),
  }));
}

export function resolveSpecialCharacterSets(
  config: unknown,
): readonly SpecialCharacterSet[] {
  if (!isRecord(config)) {
    return cloneDefaultSets();
  }

  const rawSets = config.sets;
  const sets = Array.isArray(rawSets)
    ? normalizeArraySets(rawSets)
    : isRecord(rawSets)
      ? normalizeRecordSets(rawSets)
      : [];

  if (sets.length > 0) {
    return sets;
  }

  const legacyCharacters = normalizeCharacters(config.characters);

  if (legacyCharacters.length > 0) {
    return [{ label: "Personalizados", characters: legacyCharacters }];
  }

  return cloneDefaultSets();
}
