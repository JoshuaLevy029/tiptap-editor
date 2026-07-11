import { Icon } from "@iconify/react";
import {
  Box,
  Button,
  Popover,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { useState } from "react";
import { BorderFields, ColorField, SectionLabel } from "./propertyFields";
import {
  findParentTablePos,
  setTableAttrs,
  setTableWidthPercent,
} from "./tableCommands";
import { normalizeCssSize, type TableStyleAttrs } from "./tableStyles";

interface TablePropertiesPopoverProps {
  readonly anchorEl: HTMLElement;
  readonly editor: TiptapEditor;
  readonly onClose: () => void;
}

function readCurrentTableAttrs(
  editor: TiptapEditor,
): Partial<TableStyleAttrs> {
  const tablePos = findParentTablePos(editor.state);
  const table = tablePos === null ? null : editor.state.doc.nodeAt(tablePos);

  return (table?.attrs ?? {}) as Partial<TableStyleAttrs>;
}

export default function TablePropertiesPopover({
  anchorEl,
  editor,
  onClose,
}: TablePropertiesPopoverProps) {
  const [draft, setDraft] = useState<TableStyleAttrs>(() => {
    const current = readCurrentTableAttrs(editor);

    return {
      align: current.align ?? null,
      backgroundColor: current.backgroundColor ?? null,
      borderColor: current.borderColor ?? null,
      borderStyle: current.borderStyle ?? null,
      borderWidth: current.borderWidth ?? null,
      height: current.height ?? null,
    };
  });
  const [widthPercent, setWidthPercent] = useState("");

  const patch = (partial: Partial<TableStyleAttrs>) =>
    setDraft((previous) => ({ ...previous, ...partial }));

  const save = () => {
    setTableAttrs(editor, { ...draft });

    const parsed = Number.parseFloat(widthPercent.replace("%", ""));

    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 100) {
      setTableWidthPercent(editor, parsed);
    }

    onClose();
  };

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      onClose={onClose}
      open
      slotProps={{ paper: { sx: { borderRadius: 3, p: 2, width: 420 } } }}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <Stack spacing={2}>
        <SectionLabel>Borda</SectionLabel>
        <BorderFields
          color={draft.borderColor}
          onChange={patch}
          style={draft.borderStyle}
          width={draft.borderWidth}
        />

        <SectionLabel>Cor de fundo</SectionLabel>
        <ColorField
          label="Cor"
          onChange={(value) => patch({ backgroundColor: value })}
          value={draft.backgroundColor}
        />

        <Box sx={{ display: "flex", gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <SectionLabel>Dimensões</SectionLabel>
            <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              <TextField
                label="Largura (%)"
                onChange={(event) => setWidthPercent(event.target.value)}
                placeholder="100"
                size="small"
                value={widthPercent}
              />
              ×
              <TextField
                label="Altura"
                onChange={(event) =>
                  patch({ height: normalizeCssSize(event.target.value) })
                }
                size="small"
                value={draft.height ?? ""}
              />
            </Box>
          </Box>
          <Box>
            <SectionLabel>Alinhamento</SectionLabel>
            <ToggleButtonGroup
              exclusive
              onChange={(_event, value: TableStyleAttrs["align"]) =>
                patch({ align: value })
              }
              size="small"
              value={draft.align}
            >
              <ToggleButton aria-label="Tabela à esquerda" value="left">
                <Icon icon="material-symbols:format-align-left" />
              </ToggleButton>
              <ToggleButton aria-label="Tabela centralizada" value="center">
                <Icon icon="material-symbols:format-align-center" />
              </ToggleButton>
              <ToggleButton aria-label="Tabela à direita" value="right">
                <Icon icon="material-symbols:format-align-right" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button
            color="inherit"
            onClick={onClose}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={save}
            sx={{ borderRadius: 2, textTransform: "none" }}
            variant="contained"
          >
            Salvar
          </Button>
        </Box>
      </Stack>
    </Popover>
  );
}
