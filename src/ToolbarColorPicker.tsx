import { Icon } from "@iconify/react";
import {
  Box,
  Button,
  Divider,
  Popover,
  Tooltip,
} from "@mui/material";
import type { ColorPickerToolbarItemSpec } from "./features";
import { ROUNDED_PAPER_SLOT_PROPS } from "./ui";

interface ToolbarColorPickerProps {
  readonly anchorEl: HTMLElement | null;
  readonly current: string | undefined;
  readonly item: ColorPickerToolbarItemSpec;
  readonly onClose: () => void;
  readonly onPick: (color: string) => void;
}

export function ToolbarColorPicker({
  anchorEl,
  current,
  item,
  onClose,
  onPick,
}: ToolbarColorPickerProps) {
  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      onClose={onClose}
      open={anchorEl !== null}
      slotProps={ROUNDED_PAPER_SLOT_PROPS}
    >
      <Box sx={{ p: 1.5, width: 168 }}>
        <Box
          role="listbox"
          aria-label={item.label}
          sx={{
            display: "grid",
            gap: 0.5,
            gridTemplateColumns: "repeat(6, 1fr)",
          }}
        >
          {item.colors.map((color) => (
            <Tooltip key={color} title={color}>
              <Box
                aria-label={color}
                aria-selected={color === current}
                component="button"
                onClick={() => onPick(color)}
                role="option"
                sx={{
                  bgcolor: color,
                  border: 2,
                  borderColor: color === current ? "primary.main" : "divider",
                  borderRadius: 0.75,
                  cursor: "pointer",
                  height: 22,
                  p: 0,
                  width: 22,
                }}
                type="button"
              />
            </Tooltip>
          ))}
        </Box>
        {item.allowCustom === true ? (
          <Box sx={{ mt: 1 }}>
            <Box
              aria-label={`${item.label} — cor personalizada`}
              component="input"
              onChange={(event) => onPick(event.currentTarget.value)}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 0.75,
                cursor: "pointer",
                height: 28,
                p: 0,
                width: "100%",
              }}
              type="color"
              value={current ?? "#000000"}
            />
          </Box>
        ) : null}
        <Divider sx={{ my: 1 }} />
        <Button
          fullWidth
          onClick={() => onPick("")}
          size="small"
          startIcon={<Icon icon="material-symbols:format-color-reset" />}
        >
          {item.unsetLabel}
        </Button>
      </Box>
    </Popover>
  );
}
