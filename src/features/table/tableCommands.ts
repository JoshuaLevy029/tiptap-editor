import type { Editor as TiptapEditor } from "@tiptap/react";
import type { EditorState } from "@tiptap/pm/state";
import { CellSelection, TableMap, selectionCell } from "@tiptap/pm/tables";

export type MergeDirection = "up" | "down" | "left" | "right";

interface CellContext {
  readonly cellPos: number;
  readonly map: TableMap;
  readonly rect: { bottom: number; left: number; right: number; top: number };
  readonly tableStart: number;
}

function cellContext(state: EditorState): CellContext | null {
  try {
    const $cell = selectionCell(state);
    const table = $cell.node(-1);
    const tableStart = $cell.start(-1);
    const map = TableMap.get(table);

    return {
      cellPos: $cell.pos,
      map,
      rect: map.findCell($cell.pos - tableStart),
      tableStart,
    };
  } catch {
    return null;
  }
}

function neighborCellPos(
  state: EditorState,
  direction: MergeDirection,
): number | null {
  const context = cellContext(state);

  if (context === null) {
    return null;
  }

  const { map, rect, tableStart } = context;
  let row = rect.top;
  let column = rect.left;

  if (direction === "up") {
    if (rect.top === 0) {
      return null;
    }
    row = rect.top - 1;
  } else if (direction === "down") {
    if (rect.bottom === map.height) {
      return null;
    }
    row = rect.bottom;
  } else if (direction === "left") {
    if (rect.left === 0) {
      return null;
    }
    column = rect.left - 1;
  } else {
    if (rect.right === map.width) {
      return null;
    }
    column = rect.right;
  }

  const neighbor = map.map[row * map.width + column];

  return neighbor === undefined ? null : tableStart + neighbor;
}

export function canMergeTowards(
  state: EditorState,
  direction: MergeDirection,
): boolean {
  return neighborCellPos(state, direction) !== null;
}

/** Seleciona a célula atual + vizinha na direção e mescla (estilo CKEditor). */
export function mergeTowards(
  editor: TiptapEditor,
  direction: MergeDirection,
): boolean {
  const state = editor.state;
  const neighbor = neighborCellPos(state, direction);
  const context = cellContext(state);

  if (neighbor === null || context === null) {
    return false;
  }

  return editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.setSelection(
        new CellSelection(
          tr.doc.resolve(context.cellPos),
          tr.doc.resolve(neighbor),
        ),
      );
      return true;
    })
    .mergeCells()
    .run();
}

export function selectColumn(editor: TiptapEditor): boolean {
  try {
    const $cell = selectionCell(editor.state);

    return editor
      .chain()
      .command(({ tr }) => {
        tr.setSelection(CellSelection.colSelection(tr.doc.resolve($cell.pos)));
        return true;
      })
      .run();
  } catch {
    return false;
  }
}

export function selectRow(editor: TiptapEditor): boolean {
  try {
    const $cell = selectionCell(editor.state);

    return editor
      .chain()
      .command(({ tr }) => {
        tr.setSelection(CellSelection.rowSelection(tr.doc.resolve($cell.pos)));
        return true;
      })
      .run();
  } catch {
    return false;
  }
}

/** Posição do node de tabela que envolve a seleção, ou null. */
export function findParentTablePos(state: EditorState): number | null {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === "table") {
      return $from.before(depth);
    }
  }

  return null;
}

export function hasHeaderRow(state: EditorState): boolean {
  const tablePos = findParentTablePos(state);
  const table = tablePos === null ? null : state.doc.nodeAt(tablePos);
  const firstRow = table?.firstChild ?? null;

  if (firstRow === null || firstRow.childCount === 0) {
    return false;
  }

  for (let index = 0; index < firstRow.childCount; index += 1) {
    if (firstRow.child(index).type.name !== "tableHeader") {
      return false;
    }
  }

  return true;
}

export function hasHeaderColumn(state: EditorState): boolean {
  const tablePos = findParentTablePos(state);
  const table = tablePos === null ? null : state.doc.nodeAt(tablePos);

  if (table === null || table === undefined || table.childCount === 0) {
    return false;
  }

  for (let rowIndex = 0; rowIndex < table.childCount; rowIndex += 1) {
    const firstCell = table.child(rowIndex).firstChild;

    if (firstCell === null || firstCell.type.name !== "tableHeader") {
      return false;
    }
  }

  return true;
}

export function setTableAttrs(
  editor: TiptapEditor,
  patch: Record<string, unknown>,
): boolean {
  const tablePos = findParentTablePos(editor.state);

  if (tablePos === null) {
    return false;
  }

  return editor
    .chain()
    .command(({ tr }) => {
      const table = tr.doc.nodeAt(tablePos);

      if (table === null) {
        return false;
      }

      tr.setNodeMarkup(tablePos, undefined, { ...table.attrs, ...patch });
      return true;
    })
    .run();
}

/**
 * Redimensiona a tabela para uma fração da largura do editor, escalando as
 * colwidths proporcionalmente (compatível com o resize por arraste).
 */
export function setTableWidthPercent(
  editor: TiptapEditor,
  percent: number,
): boolean {
  const tablePos = findParentTablePos(editor.state);

  if (tablePos === null || percent <= 0) {
    return false;
  }

  const editorWidth = editor.view.dom.clientWidth;
  const targetWidth = Math.max(((editorWidth - 32) * percent) / 100, 100);

  return editor
    .chain()
    .command(({ tr }) => {
      const table = tr.doc.nodeAt(tablePos);

      if (table === null) {
        return false;
      }

      let currentTotal = 0;
      const firstRow = table.firstChild;

      if (firstRow === null) {
        return false;
      }

      for (let index = 0; index < firstRow.childCount; index += 1) {
        const colwidth = firstRow.child(index).attrs.colwidth;
        currentTotal += Array.isArray(colwidth)
          ? colwidth.reduce((sum: number, item: number) => sum + item, 0)
          : 0;
      }

      if (currentTotal <= 0) {
        return false;
      }

      const factor = targetWidth / currentTotal;

      table.descendants((cell, pos) => {
        if (
          cell.type.name !== "tableCell" &&
          cell.type.name !== "tableHeader"
        ) {
          return true;
        }

        const colwidth = cell.attrs.colwidth;

        if (Array.isArray(colwidth)) {
          tr.setNodeMarkup(tablePos + 1 + pos, undefined, {
            ...cell.attrs,
            colwidth: colwidth.map((width: number) =>
              Math.max(30, Math.round(width * factor)),
            ),
          });
        }

        return false;
      });

      return true;
    })
    .run();
}

/** Elemento DOM da célula ativa (âncora do balloon), ou null. */
export function activeCellElement(editor: TiptapEditor): HTMLElement | null {
  try {
    const $cell = selectionCell(editor.state);
    const dom = editor.view.nodeDOM($cell.pos);

    return dom instanceof HTMLElement ? dom : null;
  } catch {
    return null;
  }
}
