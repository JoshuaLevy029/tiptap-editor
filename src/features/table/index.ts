import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import type { TableFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";
import { insertResizableTable } from "./helpers";
import { TableBalloon } from "./TableBalloon";
import { cellStyleAttributeDefs, tableStyleAttributeDefs } from "./tableStyles";

const StyledTable = Table.extend({
  addAttributes() {
    return { ...this.parent?.(), ...tableStyleAttributeDefs() };
  },
});

const StyledTableCell = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellStyleAttributeDefs() };
  },
});

const StyledTableHeader = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellStyleAttributeDefs() };
  },
});

const DEFAULT_CONFIG: Required<TableFeatureConfig> = {
  resizable: true,
};

export const tableFeature = defineFeature<
  "table",
  Required<TableFeatureConfig>
>({
  key: "table",
  defaultEnabled: true,
  resolveConfig: (flag) => {
    const config = resolveFeatureFlag(flag, () => ({ ...DEFAULT_CONFIG }));

    if (config === null) {
      return null;
    }

    return { ...DEFAULT_CONFIG, ...config };
  },
  extensions: (config) => [
    StyledTable.configure({ resizable: config.resizable }),
    TableRow,
    StyledTableHeader,
    StyledTableCell,
  ],
  floating: TableBalloon,
  toolbarItems: () => [
    {
      type: "toggle",
      key: "table",
      label: "Inserir tabela 3 × 3",
      icon: "lucide:table-2",
      isActive: (editor) => editor.isActive("table"),
      // Demais ações (linhas, colunas, mesclagem, propriedades) vivem no
      // balloon flutuante; dentro de tabela o botão fica inerte.
      isDisabled: (editor) => editor.isActive("table"),
      onClick: (editor) =>
        insertResizableTable(editor, {
          cols: 3,
          rows: 3,
          withHeaderRow: true,
        }),
    },
  ],
});
