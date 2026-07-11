import { Icon } from "@iconify/react";
import {
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popper,
  Switch,
  Tooltip,
} from "@mui/material";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { lazy, Suspense, useState, type ReactNode } from "react";
import type { FeatureFloatingProps } from "../types";
import {
  activeCellElement,
  canMergeTowards,
  hasHeaderColumn,
  hasHeaderRow,
  mergeTowards,
  selectColumn,
  selectRow,
} from "./tableCommands";

const CellPropertiesPopover = lazy(() => import("./CellPropertiesPopover"));
const TablePropertiesPopover = lazy(() => import("./TablePropertiesPopover"));

interface BalloonMenuItem {
  readonly disabled?: boolean;
  readonly label: string;
  readonly run: (editor: TiptapEditor) => void;
  /** Item com Switch (toggle de cabeçalho). */
  readonly toggle?: boolean;
  readonly toggleValue?: boolean;
}

interface BalloonMenuProps {
  readonly editor: TiptapEditor;
  readonly icon: string;
  readonly items: readonly BalloonMenuItem[];
  readonly label: string;
}

function BalloonMenu({ editor, icon, items, label }: BalloonMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          aria-haspopup="menu"
          aria-label={label}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          size="small"
          sx={{ borderRadius: 1 }}
        >
          <Icon icon={icon} />
          <Icon fontSize={13} icon="material-symbols:arrow-drop-down" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        open={anchorEl !== null}
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        {items.map((item, index) => (
          <MenuItem
            disabled={item.disabled === true}
            key={`${item.label}-${index}`}
            onClick={() => {
              item.run(editor);

              if (item.toggle !== true) {
                setAnchorEl(null);
              }
            }}
          >
            <ListItemText primary={item.label} />
            {item.toggle === true ? (
              <Switch
                checked={item.toggleValue === true}
                edge="end"
                size="small"
                sx={{ ml: 2 }}
              />
            ) : null}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

interface PropsButtonProps {
  readonly icon: string;
  readonly label: string;
  readonly popover: (anchor: HTMLElement, onClose: () => void) => ReactNode;
}

function PropsButton({ icon, label, popover }: PropsButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          size="small"
          sx={{ borderRadius: 1 }}
        >
          <Icon icon={icon} />
        </IconButton>
      </Tooltip>
      {anchorEl !== null ? (
        <Suspense fallback={null}>
          {popover(anchorEl, () => setAnchorEl(null))}
        </Suspense>
      ) : null}
    </>
  );
}

export function TableBalloon({ editor }: FeatureFloatingProps) {
  const inTable = editor.isEditable && editor.isActive("table");
  const anchor = inTable ? activeCellElement(editor) : null;

  if (!inTable || anchor === null) {
    return null;
  }

  const state = editor.state;

  return (
    <Popper
      anchorEl={anchor}
      open
      placement="top"
      sx={{ zIndex: (theme) => theme.zIndex.tooltip - 1 }}
    >
      <Paper
        elevation={3}
        sx={{
          alignItems: "center",
          borderRadius: 2,
          display: "flex",
          gap: 0.25,
          mb: 0.75,
          p: 0.5,
        }}
      >
        <BalloonMenu
          editor={editor}
          icon="material-symbols:view-column-outline"
          items={[
            {
              label: "Coluna de cabeçalho",
              run: (e) => e.chain().focus().toggleHeaderColumn().run(),
              toggle: true,
              toggleValue: hasHeaderColumn(state),
            },
            {
              label: "Inserir coluna à esquerda",
              run: (e) => e.chain().focus().addColumnBefore().run(),
            },
            {
              label: "Inserir coluna à direita",
              run: (e) => e.chain().focus().addColumnAfter().run(),
            },
            {
              label: "Excluir coluna",
              run: (e) => e.chain().focus().deleteColumn().run(),
            },
            { label: "Selecionar coluna", run: (e) => selectColumn(e) },
          ]}
          label="Coluna"
        />
        <BalloonMenu
          editor={editor}
          icon="material-symbols:table-rows-outline"
          items={[
            {
              label: "Linha de cabeçalho",
              run: (e) => e.chain().focus().toggleHeaderRow().run(),
              toggle: true,
              toggleValue: hasHeaderRow(state),
            },
            {
              label: "Inserir linha acima",
              run: (e) => e.chain().focus().addRowBefore().run(),
            },
            {
              label: "Inserir linha abaixo",
              run: (e) => e.chain().focus().addRowAfter().run(),
            },
            {
              label: "Excluir linha",
              run: (e) => e.chain().focus().deleteRow().run(),
            },
            { label: "Selecionar linha", run: (e) => selectRow(e) },
          ]}
          label="Linha"
        />
        <BalloonMenu
          editor={editor}
          icon="material-symbols:cell-merge"
          items={[
            {
              disabled: !canMergeTowards(state, "up"),
              label: "Mesclar acima",
              run: (e) => mergeTowards(e, "up"),
            },
            {
              disabled: !canMergeTowards(state, "right"),
              label: "Mesclar à direita",
              run: (e) => mergeTowards(e, "right"),
            },
            {
              disabled: !canMergeTowards(state, "down"),
              label: "Mesclar abaixo",
              run: (e) => mergeTowards(e, "down"),
            },
            {
              disabled: !canMergeTowards(state, "left"),
              label: "Mesclar à esquerda",
              run: (e) => mergeTowards(e, "left"),
            },
            {
              disabled: !editor.can().splitCell(),
              label: "Dividir célula",
              run: (e) => e.chain().focus().splitCell().run(),
            },
            {
              disabled: !editor.can().mergeCells(),
              label: "Mesclar células selecionadas",
              run: (e) => e.chain().focus().mergeCells().run(),
            },
          ]}
          label="Mesclar células"
        />
        <Divider flexItem orientation="vertical" sx={{ mx: 0.25 }} />
        <PropsButton
          icon="material-symbols:position-bottom-right-outline"
          label="Propriedades da célula"
          popover={(popAnchor, onClose) => (
            <CellPropertiesPopover
              anchorEl={popAnchor}
              editor={editor}
              onClose={onClose}
            />
          )}
        />
        <PropsButton
          icon="material-symbols:table-outline"
          label="Propriedades da tabela"
          popover={(popAnchor, onClose) => (
            <TablePropertiesPopover
              anchorEl={popAnchor}
              editor={editor}
              onClose={onClose}
            />
          )}
        />
        <Divider flexItem orientation="vertical" sx={{ mx: 0.25 }} />
        <Tooltip title="Excluir tabela">
          <IconButton
            aria-label="Excluir tabela"
            onClick={() => editor.chain().focus().deleteTable().run()}
            size="small"
            sx={{ borderRadius: 1 }}
          >
            <Icon icon="material-symbols:delete-outline" />
          </IconButton>
        </Tooltip>
      </Paper>
    </Popper>
  );
}
