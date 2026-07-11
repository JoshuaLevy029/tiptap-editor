import CodeBlock from "@tiptap/extension-code-block";
import { lazy } from "react";
import type { SourceCodeFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";

const SourceCodeDialog = lazy(() => import("./SourceCodeDialog"));

interface ResolvedSourceCodeFeatureConfig {
  readonly mode: "html" | "codeBlock";
}

const DEFAULT_CONFIG: ResolvedSourceCodeFeatureConfig = { mode: "html" };

export const sourceCodeFeature = defineFeature<
  "sourceCode",
  ResolvedSourceCodeFeatureConfig
>({
  key: "sourceCode",
  defaultEnabled: true,
  resolveConfig: (flag) => {
    const config = resolveFeatureFlag<SourceCodeFeatureConfig>(flag, () => ({
      ...DEFAULT_CONFIG,
    }));

    return config === null
      ? null
      : { mode: config.mode ?? DEFAULT_CONFIG.mode };
  },
  extensions: (config) => (config.mode === "codeBlock" ? [CodeBlock] : []),
  toolbarItems: (config) =>
    config.mode === "codeBlock"
      ? [
          {
            type: "toggle",
            key: "sourceCode",
            label: "Bloco de código",
            icon: "lucide:square-code",
            isActive: (editor) => editor.isActive("codeBlock"),
            onClick: (editor) => editor.chain().focus().toggleCodeBlock().run(),
          },
        ]
      : [
          {
            type: "dialog",
            key: "sourceCode",
            label: "Código-fonte HTML",
            icon: "lucide:code-xml",
            component: SourceCodeDialog,
          },
        ],
});
