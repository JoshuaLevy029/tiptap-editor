import type { Editor as TiptapEditor } from "@tiptap/react";
import type { Transaction } from "@tiptap/pm/state";

const MIN_COLUMN_WIDTH = 50;
/** Padding horizontal do conteúdo do editor (p: 2 ⇒ 16px por lado). */
const CONTENT_PADDING = 32;

function countColumns(firstRow: { childCount: number; child: (i: number) => { attrs: Record<string, unknown> } }): number {
  let count = 0;

  for (let index = 0; index < firstRow.childCount; index += 1) {
    const colspan = firstRow.child(index).attrs.colspan;
    count += typeof colspan === "number" ? colspan : 1;
  }

  return count;
}

/**
 * Fixa a largura de TODAS as colunas da tabela que envolve a seleção.
 * Com todas as colunas fixas, o plugin de resize passa a dar largura px à
 * própria tabela — arrastar qualquer divisória (inclusive a borda direita)
 * amplia/reduz a tabela inteira em vez de só redistribuir o espaço.
 */
export function fixAllColumnWidths(
  tr: Transaction,
  editorWidth: number,
): boolean {
  const { $from } = tr.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const table = $from.node(depth);

    if (table.type.name !== "table") {
      continue;
    }

    const firstRow = table.firstChild;

    if (firstRow === null) {
      return false;
    }

    const columns = countColumns(firstRow);
    const available = Math.max(editorWidth - CONTENT_PADDING, 0);
    const columnWidth = Math.max(
      MIN_COLUMN_WIDTH,
      Math.floor(available / Math.max(columns, 1)),
    );
    const tablePos = $from.before(depth);

    table.descendants((cell, pos) => {
      if (
        cell.type.name !== "tableCell" &&
        cell.type.name !== "tableHeader"
      ) {
        return true;
      }

      if (cell.attrs.colwidth == null) {
        const colspan =
          typeof cell.attrs.colspan === "number" ? cell.attrs.colspan : 1;
        tr.setNodeMarkup(tablePos + 1 + pos, undefined, {
          ...cell.attrs,
          colwidth: Array.from({ length: colspan }, () => columnWidth),
        });
      }

      return false;
    });

    return true;
  }

  return false;
}

/** Insere uma tabela já com todas as colunas de largura fixa (redimensionável por inteiro). */
export function insertResizableTable(
  editor: TiptapEditor,
  options: { cols: number; rows: number; withHeaderRow: boolean },
): boolean {
  return editor
    .chain()
    .focus()
    .insertTable(options)
    .command(({ tr, view }) => fixAllColumnWidths(tr, view.dom.clientWidth))
    .run();
}
