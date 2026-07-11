import type { Editor as TiptapEditor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import type {
  ChemistryFeatureConfig,
  ChemistryPaletteGroupConfig,
} from "../../types";
import { openFormulaDialogAt } from "../math/formulaNodes";

export type ChemistryPaletteItem = NonNullable<
  ChemistryFeatureConfig["palette"]
>[number];

export const DEFAULT_CHEMISTRY_SOURCE = "\\ce{}";

export const DEFAULT_CHEMISTRY_GROUPS: readonly ChemistryPaletteGroupConfig[] =
  [
    {
      label: "Setas",
      items: [
        { label: "→", value: "->" },
        { label: "⇌", value: "<=>" },
        { label: "←", value: "<-" },
        { label: "↔", value: "<->" },
        { label: "Δ na seta", value: "->[\\Delta]" },
        { label: "catalisador", value: "->[catalisador]" },
      ],
    },
    {
      label: "Estados",
      items: [
        { label: "sólido", value: "(s)" },
        { label: "líquido", value: "(l)" },
        { label: "gasoso", value: "(g)" },
        { label: "aquoso", value: "(aq)" },
      ],
    },
    {
      label: "Cargas",
      items: [
        { label: "+", value: "^+" },
        { label: "2+", value: "^2+" },
        { label: "−", value: "^-" },
        { label: "2−", value: "^2-" },
      ],
    },
    {
      label: "Partículas",
      items: [
        { label: "elétron", value: "e-" },
        { label: "próton", value: "p+" },
        { label: "nêutron", value: "n0" },
        { label: "isótopo", value: "^{A}_{Z}X" },
      ],
    },
    {
      label: "Indicadores",
      items: [
        { label: "gás ↑", value: "^" },
        { label: "precipitado ↓", value: "v" },
        { label: "hidratado", value: " * " },
      ],
    },
  ];

export const DEFAULT_CHEMISTRY_TEMPLATES: readonly ChemistryPaletteItem[] = [
  { label: "Combustão do metano", value: "CH4 + 2O2 -> CO2 + 2H2O" },
  { label: "Neutralização", value: "HCl + NaOH -> NaCl + H2O" },
  { label: "Equilíbrio de Haber", value: "N2 + 3H2 <=> 2NH3" },
  { label: "Precipitação", value: "AgNO3 + NaCl -> AgCl v + NaNO3" },
  { label: "Decomposição térmica", value: "CaCO3 ->[\\Delta] CaO + CO2 ^" },
  { label: "Fotossíntese", value: "6CO2 + 6H2O ->[luz] C6H12O6 + 6O2" },
  { label: "Autoionização da água", value: "2H2O <=> H3O+ + OH-" },
  { label: "Deslocamento (redox)", value: "Zn + CuSO4 -> ZnSO4 + Cu" },
];

export interface ChemistryUiOptions {
  readonly groups: readonly ChemistryPaletteGroupConfig[];
  readonly templates: readonly ChemistryPaletteItem[];
}

const CE_WRAPPER_PATTERN = /^\\ce\{([\s\S]*)\}$/;

export interface CeSource {
  /** Conteúdo editável (sem o invólucro \ce{} quando wrapped). */
  readonly inner: string;
  /** true quando o latex é exatamente \ce{...} e o invólucro fica implícito na UI. */
  readonly wrapped: boolean;
}

export function splitCeWrapper(latex: string): CeSource {
  const match = CE_WRAPPER_PATTERN.exec(latex);

  return match === null
    ? { inner: latex, wrapped: false }
    : { inner: match[1] ?? "", wrapped: true };
}

export function joinCeWrapper(source: CeSource): string {
  return source.wrapped ? `\\ce{${source.inner}}` : source.inner;
}

export type ChemistryMathNodeName = "inlineMath" | "blockMath";

export interface ChemistryNodeTarget {
  readonly latex: string;
  readonly nodeType: ChemistryMathNodeName;
  readonly position: number;
}

export interface ChemistrySelectionRange {
  readonly from: number;
  readonly to: number;
}

function isMathNodeName(name: string): name is ChemistryMathNodeName {
  return name === "inlineMath" || name === "blockMath";
}

/** Returns a chemistry formula only when the current selection is that exact node. */
export function getSelectedChemistryNode(
  editor: TiptapEditor,
): ChemistryNodeTarget | null {
  const { selection } = editor.state;
  const position = selection.from;

  if (
    !(selection instanceof NodeSelection) ||
    !isMathNodeName(selection.node.type.name) ||
    selection.node.attrs.kind !== "chemistry"
  ) {
    return null;
  }

  return {
    latex:
      typeof selection.node.attrs.latex === "string"
        ? selection.node.attrs.latex
        : "",
    nodeType: selection.node.type.name,
    position,
  };
}

/**
 * Updates the captured node in place, or inserts a new inline node at the
 * current selection. A stale edit target never falls back to insertion.
 */
export function commitChemistryFormula(
  editor: TiptapEditor,
  latex: string,
  target: ChemistryNodeTarget | null,
  selection: ChemistrySelectionRange,
): boolean {
  if (target === null) {
    return editor
      .chain()
      .focus()
      .insertContentAt(selection, {
        attrs: { kind: "chemistry", latex },
        type: "inlineMath",
      })
      .run();
  }

  const currentNode = editor.state.doc.nodeAt(target.position);

  if (
    currentNode === null ||
    currentNode.type.name !== target.nodeType ||
    currentNode.attrs.kind !== "chemistry" ||
    currentNode.attrs.latex !== target.latex
  ) {
    return false;
  }

  if (latex === target.latex) {
    return true;
  }

  return editor
    .chain()
    .focus()
    .command(({ tr }) => {
      const node = tr.doc.nodeAt(target.position);

      if (
        node === null ||
        node.type.name !== target.nodeType ||
        node.attrs.kind !== "chemistry" ||
        node.attrs.latex !== target.latex
      ) {
        return false;
      }

      tr.setNodeMarkup(
        target.position,
        node.type,
        {
          ...node.attrs,
          kind: "chemistry",
          latex,
        },
        node.marks,
      );
      return true;
    })
    .run();
}

export interface SnippetInsertion {
  readonly cursor: number;
  readonly value: string;
}

export function insertSnippet(
  source: string,
  snippet: string,
  selectionStart: number,
  selectionEnd: number,
): SnippetInsertion {
  const start = Math.max(0, Math.min(selectionStart, source.length));
  const end = Math.max(start, Math.min(selectionEnd, source.length));

  return {
    cursor: start + snippet.length,
    value: `${source.slice(0, start)}${snippet}${source.slice(end)}`,
  };
}

export function getChemistryUi(editor: TiptapEditor): ChemistryUiOptions {
  const extension = editor.extensionManager.extensions.find(
    (candidate) => candidate.name === "chemistryUi",
  );
  const options = extension?.options as Partial<ChemistryUiOptions> | undefined;

  return {
    groups: options?.groups ?? DEFAULT_CHEMISTRY_GROUPS,
    templates: options?.templates ?? DEFAULT_CHEMISTRY_TEMPLATES,
  };
}

export function openSelectedChemistryDialog(editor: TiptapEditor): boolean {
  const target = getSelectedChemistryNode(editor);
  return target === null ? false : openFormulaDialogAt(editor, target.position);
}
