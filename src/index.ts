export { Editor } from "./Editor";
export { DocumentEditor, type DocumentEditorProps } from "./DocumentEditor";
export { ApostilaEditor, type ApostilaEditorProps } from "./ApostilaEditor";
export { REGISTRY, applyUiOverrides, defineFeature, resolveFeatureFlag } from "./features";
export { EDITOR_THEME_OPTIONS, createEditorTheme } from "./theme";

export type {
  ColorPickerToolbarItemSpec,
  DialogToolbarItemSpec,
  EmptyFeatureConfig,
  FeatureKey,
  FeatureModule,
  EditorUiOverrides,
  MenuToolbarItemOption,
  MenuToolbarItemSpec,
  ToggleToolbarItemSpec,
  ToolbarDialogProps,
  ToolbarItemOverride,
  ToolbarItemSpec,
} from "./features";

export type {
  BulletListFeatureConfig,
  ChemistryFeatureConfig,
  ColumnsFeatureConfig,
  ColorFeatureConfig,
  EditorContentValue,
  EditorDocumentJSON,
  EditorFeatures,
  EditorHandle,
  EditorProps,
  EditorSaveFormat,
  FeatureFlag,
  FontFamilyFeatureConfig,
  FontSizeFeatureConfig,
  HeadingLevel,
  ImageFeatureConfig,
  IndentFeatureConfig,
  LineHeightFeatureConfig,
  MathFeatureConfig,
  MathKeyboardLayout,
  OrderedListFeatureConfig,
  SpecialCharacterConfig,
  SpecialCharacterSetConfig,
  SourceCodeFeatureConfig,
  SpecialCharactersFeatureConfig,
  TableFeatureConfig,
  TextAlignFeatureConfig,
  TextTypeFeatureConfig,
} from "./types";
