import type { AnyExtension, Editor as TiptapEditor } from "@tiptap/react";
import type { ComponentType, LazyExoticComponent, ReactNode } from "react";
import type { EditorFeatures, FeatureFlag } from "../types";

export type FeatureKey = keyof EditorFeatures;

export type EmptyFeatureConfig = Readonly<Record<string, never>>;

/** Ícone de item da toolbar: nome Iconify ("mdi:…") ou elemento React. */
export type ToolbarIcon = string | ReactNode;

interface ToolbarItemBase {
  readonly key: string;
  readonly label: string;
  isDisabled?(editor: TiptapEditor): boolean;
}

export interface ToggleToolbarItemSpec extends ToolbarItemBase {
  readonly type: "toggle";
  readonly icon: ToolbarIcon;
  isActive(editor: TiptapEditor): boolean;
  onClick(editor: TiptapEditor): void;
}

export interface MenuToolbarItemOption {
  readonly label: string;
  readonly value: string;
  /** Estilos aplicados ao rótulo no menu (ex.: item H1 em tipografia de H1). */
  readonly labelSx?: Readonly<Record<string, unknown>>;
  /** Quadradinho de cor exibido junto ao rótulo. */
  readonly swatch?: string;
  /**
   * Pré-visualização de lista: sequência de marcadores (ex.: ["1.", "2.", "3."]).
   * Quando presente, o item exibe uma mini-lista no lugar do rótulo textual
   * (o label vira aria-label/tooltip).
   */
  readonly markers?: readonly string[];
}

export interface MenuToolbarItemSpec extends ToolbarItemBase {
  readonly type: "menu";
  readonly icon: ToolbarIcon;
  readonly options: readonly MenuToolbarItemOption[];
  getValue(editor: TiptapEditor): string;
  onChange(editor: TiptapEditor, value: string): void;
  isActive?(editor: TiptapEditor): boolean;
}

export interface ColorPickerToolbarItemSpec extends ToolbarItemBase {
  readonly type: "colorPicker";
  readonly icon: ToolbarIcon;
  /** Paleta exibida no popover. */
  readonly colors: readonly string[];
  /** Rótulo da opção que remove a cor (valor ""). */
  readonly unsetLabel: string;
  /** Exibe também um seletor de cor livre além da paleta. */
  readonly allowCustom?: boolean;
  getValue(editor: TiptapEditor): string | undefined;
  onChange(editor: TiptapEditor, value: string): void;
}

export interface ToolbarDialogProps {
  readonly editor: TiptapEditor;
  readonly open: boolean;
  readonly onClose: () => void;
}

export interface DialogToolbarItemSpec extends ToolbarItemBase {
  readonly type: "dialog";
  readonly icon: ToolbarIcon;
  readonly component: LazyExoticComponent<ComponentType<ToolbarDialogProps>>;
  isActive?(editor: TiptapEditor): boolean;
}

export type ToolbarItemSpec =
  | ToggleToolbarItemSpec
  | MenuToolbarItemSpec
  | ColorPickerToolbarItemSpec
  | DialogToolbarItemSpec;

export interface FeatureFloatingProps {
  readonly editor: TiptapEditor;
}

export interface FeatureModule<
  TKey extends FeatureKey = FeatureKey,
  TConfig = unknown,
> {
  readonly key: TKey;
  readonly defaultEnabled: true;
  resolveConfig(flag: EditorFeatures[TKey]): TConfig | null;
  extensions(config: TConfig): AnyExtension[];
  toolbarItems(config: TConfig): ToolbarItemSpec[];
  /** UI flutuante sempre montada com o editor (ex.: balloon da tabela). */
  readonly floating?: ComponentType<FeatureFloatingProps>;
}

export function defineFeature<TKey extends FeatureKey, TConfig>(
  module: FeatureModule<TKey, TConfig>,
): FeatureModule<TKey, TConfig> {
  return module;
}

export function resolveFeatureFlag<TConfig>(
  flag: FeatureFlag<TConfig>,
  defaults: () => TConfig,
): TConfig | null {
  if (flag === false) {
    return null;
  }

  if (flag === true || flag === undefined) {
    return defaults();
  }

  return flag;
}
