import type { Editor as TiptapEditor, JSONContent } from "@tiptap/react";

export type FeatureFlag<TConfig = never> = boolean | TConfig | undefined;

/** Formato do conteúdo emitido em onChange e aceito em defaultValue. */
export type EditorSaveFormat = "html" | "markdown";

/** Conteúdo serializado do documento (HTML ou Markdown, conforme saveAs). */
export type EditorContentValue = string;

export type EditorDocumentJSON = JSONContent;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface TextTypeFeatureConfig {
  levels?: HeadingLevel[];
}

export interface BulletListFeatureConfig {
  styles?: Array<"disc" | "dash">;
}

export interface OrderedListFeatureConfig {
  types?: Array<"1" | "a" | "A" | "i" | "I">;
}

export interface ColumnsFeatureConfig {
  /** Quantidades de colunas oferecidas no menu (2–4). Default: [2, 3]. */
  counts?: number[];
}

export interface IndentFeatureConfig {
  maxLevel?: number;
  step?: number;
}

export type ImageFeatureConfig = {
  /** Resolves a file to the final image src. Defaults to an internal data URL. */
  onUpload?: (file: File) => Promise<string>;
  /** Defaults to PNG, JPEG, WebP, and GIF MIME types. */
  accept?: string[];
  /** Maximum accepted file size in bytes. */
  maxSizeBytes?: number;
  /** Receives validation and upload errors. */
  onUploadError?: (error: Error, file: File) => void;
};

export interface TableFeatureConfig {
  resizable?: boolean;
}

export interface TextAlignFeatureConfig {
  alignments?: Array<"left" | "center" | "right" | "justify">;
}

export interface LineHeightFeatureConfig {
  /** Opções do menu de entrelinha. Default: 1 / 1,15 / 1,5 / 2. */
  options?: Array<{ label: string; value: string }>;
}

export interface ColorFeatureConfig {
  colors?: string[];
}

export interface FontFamilyFeatureConfig {
  fonts?: Array<{ label: string; value: string }>;
}

export interface FontSizeFeatureConfig {
  sizes?: Array<{ label: string; value: string }>;
}

export interface SpecialCharacterConfig {
  readonly label?: string;
  readonly value: string;
}

export interface SpecialCharacterSetConfig {
  readonly label: string;
  readonly characters: readonly (string | SpecialCharacterConfig)[];
}

export interface SpecialCharactersFeatureConfig {
  /** Categorized sets. A label-to-characters map is also accepted. */
  sets?:
    | readonly SpecialCharacterSetConfig[]
    | Readonly<
        Record<string, string | readonly (string | SpecialCharacterConfig)[]>
      >;
  /** Legacy flat list, shown as one custom category. */
  characters?: readonly SpecialCharacterConfig[];
}

export interface SourceCodeFeatureConfig {
  mode?: "html" | "codeBlock";
}

/**
 * Layout do teclado virtual do MathLive: nome de layout nativo ("numeric",
 * "greek"…) ou objeto de layout customizado (rows/keycaps do MathLive).
 */
export type MathKeyboardLayout = string | Record<string, unknown>;

export interface MathFeatureConfig {
  keyboardLayouts?: MathKeyboardLayout[];
  templates?: string[];
}

export interface ChemistryPaletteItemConfig {
  label: string;
  value: string;
}

export interface ChemistryPaletteGroupConfig {
  /** Rótulo da categoria (ex.: "Setas", "Estados"). */
  label: string;
  items: ChemistryPaletteItemConfig[];
}

export interface ChemistryFeatureConfig {
  /** Categorias da paleta lateral. Default: setas/estados/cargas/partículas/indicadores. */
  groups?: ChemistryPaletteGroupConfig[];
  /** Modelos prontos: equações completas nomeadas. */
  templates?: ChemistryPaletteItemConfig[];
  /** Legado: lista plana, exibida como categoria única "Paleta". */
  palette?: ChemistryPaletteItemConfig[];
}

export interface EditorFeatures {
  textType?: FeatureFlag<TextTypeFeatureConfig>;
  bold?: FeatureFlag;
  italic?: FeatureFlag;
  bulletList?: FeatureFlag<BulletListFeatureConfig>;
  orderedList?: FeatureFlag<OrderedListFeatureConfig>;
  indent?: FeatureFlag<IndentFeatureConfig>;
  columns?: FeatureFlag<ColumnsFeatureConfig>;
  image?: FeatureFlag<ImageFeatureConfig>;
  table?: FeatureFlag<TableFeatureConfig>;
  undoRedo?: FeatureFlag;
  textAlign?: FeatureFlag<TextAlignFeatureConfig>;
  lineHeight?: FeatureFlag<LineHeightFeatureConfig>;
  backgroundColor?: FeatureFlag<ColorFeatureConfig>;
  textColor?: FeatureFlag<ColorFeatureConfig>;
  fontFamily?: FeatureFlag<FontFamilyFeatureConfig>;
  fontSize?: FeatureFlag<FontSizeFeatureConfig>;
  highlight?: FeatureFlag<ColorFeatureConfig>;
  specialCharacters?: FeatureFlag<SpecialCharactersFeatureConfig>;
  strike?: FeatureFlag;
  underline?: FeatureFlag;
  subscript?: FeatureFlag;
  superscript?: FeatureFlag;
  sourceCode?: FeatureFlag<SourceCodeFeatureConfig>;
  math?: FeatureFlag<MathFeatureConfig>;
  chemistry?: FeatureFlag<ChemistryFeatureConfig>;
}

export interface EditorProps {
  /**
   * Conteúdo inicial, no formato definido por saveAs (HTML por padrão).
   * O editor é não controlado após montar.
   */
  defaultValue?: EditorContentValue;
  /**
   * Modo controlado: o conteúdo segue esta prop (formato de saveAs).
   * Mudanças externas substituem o documento; o eco do próprio onChange é
   * ignorado para não resetar o cursor. Tem precedência sobre defaultValue.
   */
  value?: EditorContentValue;
  /** Chamado a cada alteração com o documento serializado conforme saveAs. */
  onChange?: (value: EditorContentValue) => void;
  /** Formato de defaultValue e do valor emitido em onChange. Default: "html". */
  saveAs?: EditorSaveFormat;
  features?: EditorFeatures;
  /**
   * Customização de UI por item da toolbar (keyed pela chave da feature):
   * ícone (Iconify ou ReactNode), tooltip, ocultar item, ocultar opções de
   * menu. Ver SPEC 7.1.4.
   */
  ui?: import("./features/uiOverrides").EditorUiOverrides;
  readOnly?: boolean;
  placeholder?: string;
  /**
   * "standard": editor em cartão (default). "document": folhas paginadas com
   * zoom e configuração de página (componente DocumentEditor). "apostila":
   * folha única no formato do pipeline de apostilas — 736px, padding 40/24,
   * 16px/1.6 (componente ApostilaEditor).
   */
  variant?: "standard" | "document" | "apostila";
}

export interface EditorHandle {
  getJSON(): EditorDocumentJSON | null;
  getHTML(): string;
  getMarkdown(): string;
  focus(): void;
  clear(): void;
  getEditor(): TiptapEditor | null;
}
