import { forwardRef } from "react";
import { Editor } from "./Editor";
import type { EditorHandle, EditorProps } from "./types";

export type DocumentEditorProps = Omit<EditorProps, "variant">;

/**
 * Editor com visual de documento (folha branca centralizada sobre fundo
 * cinza, sombra e zoom) — atalho para <Editor variant="document" />.
 */
export const DocumentEditor = forwardRef<EditorHandle, DocumentEditorProps>(
  function DocumentEditor(props, ref) {
    return <Editor {...props} ref={ref} variant="document" />;
  },
);
