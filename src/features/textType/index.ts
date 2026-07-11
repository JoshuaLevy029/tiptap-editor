import Heading from "@tiptap/extension-heading";
import type { HeadingLevel, TextTypeFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";

const DEFAULT_LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5, 6];
const PARAGRAPH_VALUE = "paragraph";

function resolveLevels(config: TextTypeFeatureConfig): HeadingLevel[] {
  return [...(config.levels ?? DEFAULT_LEVELS)];
}

function headingValue(level: HeadingLevel): string {
  return `heading-${level}`;
}

function findHeadingLevel(
  value: string,
  levels: readonly HeadingLevel[],
): HeadingLevel | undefined {
  return levels.find((level) => headingValue(level) === value);
}

export const textTypeFeature = defineFeature<"textType", TextTypeFeatureConfig>(
  {
    key: "textType",
    defaultEnabled: true,
    resolveConfig: (flag) =>
      resolveFeatureFlag(flag, () => ({ levels: [...DEFAULT_LEVELS] })),
    extensions: (config) => [
      Heading.configure({
        levels: resolveLevels(config),
      }),
    ],
    toolbarItems: (config) => {
      const levels = resolveLevels(config);

      return [
        {
          type: "menu",
          key: "textType",
          label: "Tipo de texto",
          icon: "material-symbols:text-fields",
          isActive: (editor) => editor.isActive("heading"),
          options: [
            { label: "Parágrafo", value: PARAGRAPH_VALUE },
            ...levels.map((level) => ({
              label: `Título ${level}`,
              value: headingValue(level),
              labelSx: {
                fontSize: `${Math.max(1.5 - (level - 1) * 0.12, 0.9)}rem`,
                fontWeight: 600,
              },
            })),
          ],
          getValue: (editor) => {
            const activeLevel = levels.find((level) =>
              editor.isActive("heading", { level }),
            );

            return activeLevel === undefined
              ? PARAGRAPH_VALUE
              : headingValue(activeLevel);
          },
          onChange: (editor, value) => {
            if (value === PARAGRAPH_VALUE) {
              editor.chain().focus().setParagraph().run();
              return;
            }

            const level = findHeadingLevel(value, levels);
            if (level !== undefined) {
              editor.chain().focus().setHeading({ level }).run();
            }
          },
        },
      ];
    },
  },
);
