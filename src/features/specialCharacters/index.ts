import {
  createElement,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { defineFeature, type ToolbarDialogProps } from "../types";
import {
  resolveSpecialCharacterSets,
  type SpecialCharacterSet,
} from "./helpers";

interface ResolvedSpecialCharactersFeatureConfig {
  readonly sets: readonly SpecialCharacterSet[];
}

function createSpecialCharactersDialog(
  sets: readonly SpecialCharacterSet[],
): LazyExoticComponent<ComponentType<ToolbarDialogProps>> {
  return lazy(async () => {
    const { default: SpecialCharactersDialog } =
      await import("./SpecialCharactersDialog");

    return {
      default: (props: ToolbarDialogProps) =>
        createElement(SpecialCharactersDialog, { ...props, sets }),
    };
  });
}

export const specialCharactersFeature = defineFeature<
  "specialCharacters",
  ResolvedSpecialCharactersFeatureConfig
>({
  key: "specialCharacters",
  defaultEnabled: true,
  resolveConfig: (flag) => {
    if (flag === false) {
      return null;
    }

    return {
      sets: resolveSpecialCharacterSets(
        flag === true || flag === undefined ? undefined : flag,
      ),
    };
  },
  extensions: () => [],
  toolbarItems: (config) => [
    {
      type: "dialog",
      key: "specialCharacters",
      label: "Caracteres especiais",
      icon: "mdi:omega",
      component: createSpecialCharactersDialog(config.sets),
    },
  ],
});
