import { forwardRef } from "react";
import { Editor } from "./Editor";
import type { EditorHandle, EditorProps } from "./types";

export type ApostilaEditorProps = Omit<EditorProps, "variant">;

/**
 * Editor de páginas de apostila: folha única no formato exato do pipeline
 * de conversão de apostilas (736px de largura, padding 40/24, tipografia 16px/1.6),
 * com zoom — atalho para <Editor variant="apostila" />.
 */
export const ApostilaEditor = forwardRef<EditorHandle, ApostilaEditorProps>(
  function ApostilaEditor(props, ref) {
    return <Editor {...props} ref={ref} variant="apostila" />;
  },
);
