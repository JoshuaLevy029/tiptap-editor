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
import { selectionCell } from "@tiptap/pm/tables";
import { useState } from "react";
import { BorderFields, ColorField, SectionLabel } from "./propertyFields";
import { normalizeCssSize, type CellStyleAttrs } from "./tableStyles";

interface CellPropertiesPopoverProps {
  readonly anchorEl: HTMLElement;
  readonly editor: TiptapEditor;
  readonly onClose: () => void;
}

function readCurrentCellAttrs(editor: TiptapEditor): Partial<CellStyleAttrs> {
  try {
    const $cell = selectionCell(editor.state);
    return ($cell.nodeAfter?.attrs ?? {}) as Partial<CellStyleAttrs>;
  } catch {
    return {};
  }
}

export default function CellPropertiesPopover({
  anchorEl,
  editor,
  onClose,
}: CellPropertiesPopoverProps) {
  const [draft, setDraft] = useState<CellStyleAttrs>(() => {
    const current = readCurrentCellAttrs(editor);

    return {
      backgroundColor: current.backgroundColor ?? null,
      borderColor: current.borderColor ?? null,
      borderStyle: current.borderStyle ?? null,
      borderWidth: current.borderWidth ?? null,
      height: current.height ?? null,
      padding: current.padding ?? null,
      textAlign: current.textAlign ?? null,
      verticalAlign: current.verticalAlign ?? null,
    };
  });
  const [width, setWidth] = useState("");

  const patch = (partial: Partial<CellStyleAttrs>) =>
    setDraft((previous) => ({ ...previous, ...partial }));

  const save = () => {
    let chain = editor.chain().focus();

    for (const [key, value] of Object.entries(draft)) {
      chain = chain.setCellAttribute(key, value);
    }

    const normalizedWidth = normalizeCssSize(width);

    if (normalizedWidth !== null && normalizedWidth.endsWith("px")) {
      chain = chain.setCellAttribute("colwidth", [
        Number.parseInt(normalizedWidth, 10),
      ]);
    }

    chain.run();
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

        <SectionLabel>Dimensões</SectionLabel>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
          <TextField
            label="Largura"
            onChange={(event) => setWidth(event.target.value)}
            placeholder="120"
            size="small"
            value={width}
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
          <TextField
            label="Margem interna"
            onChange={(event) =>
              patch({ padding: normalizeCssSize(event.target.value) })
            }
            size="small"
            value={draft.padding ?? ""}
          />
        </Box>

        <SectionLabel>Alinhamento do texto na célula</SectionLabel>
        <Box sx={{ display: "flex", gap: 1 }}>
          <ToggleButtonGroup
            exclusive
            onChange={(_event, value: CellStyleAttrs["textAlign"]) =>
              patch({ textAlign: value })
            }
            size="small"
            value={draft.textAlign}
          >
            {(["left", "center", "right", "justify"] as const).map((align) => (
              <ToggleButton
                aria-label={`Alinhar texto: ${align}`}
                key={align}
                value={align}
              >
                <Icon icon={`material-symbols:format-align-${align}`} />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <ToggleButtonGroup
            exclusive
            onChange={(_event, value: CellStyleAttrs["verticalAlign"]) =>
              patch({ verticalAlign: value })
            }
            size="small"
            value={draft.verticalAlign}
          >
            <ToggleButton aria-label="Alinhar ao topo" value="top">
              <Icon icon="material-symbols:vertical-align-top" />
            </ToggleButton>
            <ToggleButton aria-label="Alinhar ao meio" value="middle">
              <Icon icon="material-symbols:vertical-align-center" />
            </ToggleButton>
            <ToggleButton aria-label="Alinhar à base" value="bottom">
              <Icon icon="material-symbols:vertical-align-bottom" />
            </ToggleButton>
          </ToggleButtonGroup>
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
