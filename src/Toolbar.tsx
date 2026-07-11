import { Icon } from "@iconify/react";
import {
  Box,
  CircularProgress,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar as MuiToolbar,
  Tooltip,
} from "@mui/material";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { Suspense, useState, type ReactNode } from "react";
import type {
  ColorPickerToolbarItemSpec,
  MenuToolbarItemSpec,
  ToolbarIcon,
  ToolbarItemSpec,
} from "./features";
import { ToolbarColorPicker } from "./ToolbarColorPicker";
import { ROUNDED_PAPER_SLOT_PROPS } from "./ui";

interface ToolbarProps {
  readonly editor: TiptapEditor;
  readonly items: readonly ToolbarItemSpec[];
  /** Controles extras exibidos antes dos itens (ex.: zoom no variant document). */
  readonly leading?: ReactNode;
  /** Controles extras no fim da toolbar (ex.: configuração da página). */
  readonly trailing?: ReactNode;
}

interface MenuButtonProps {
  readonly editor: TiptapEditor;
  readonly item: MenuToolbarItemSpec;
  readonly disabled: boolean;
}

const iconButtonSx = { borderRadius: 1 } as const;

function ItemIcon({ icon }: { readonly icon: ToolbarIcon }) {
  return typeof icon === "string" ? <Icon icon={icon} /> : <>{icon}</>;
}

function DropdownArrow() {
  return <Icon fontSize={14} icon="material-symbols:arrow-drop-down" />;
}

function ListMarkersPreview({ markers }: { readonly markers: readonly string[] }) {
  return (
    <Box aria-hidden sx={{ py: 0.25 }}>
      {markers.map((marker, index) => (
        <Box
          key={`${marker}-${index}`}
          sx={{ alignItems: "center", display: "flex", gap: 1, mb: 0.5 }}
        >
          <Box
            component="span"
            sx={{
              fontSize: "0.8rem",
              lineHeight: 1,
              minWidth: 24,
              textAlign: "right",
            }}
          >
            {marker}
          </Box>
          <Box
            sx={{
              bgcolor: "action.disabled",
              borderRadius: 1,
              height: 3,
              width: 56,
            }}
          />
        </Box>
      ))}
    </Box>
  );
}

function MenuButton({ editor, item, disabled }: MenuButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const value = item.getValue(editor);
  const active = item.isActive?.(editor) ?? false;

  return (
    <>
      <Tooltip title={item.label}>
        <Box component="span" sx={{ display: "inline-flex" }}>
          <IconButton
            aria-haspopup="menu"
            aria-label={item.label}
            color={active ? "primary" : "default"}
            disabled={disabled}
            onClick={(event) => setAnchorEl(event.currentTarget)}
            size="small"
            sx={iconButtonSx}
          >
            <ItemIcon icon={item.icon} />
            <DropdownArrow />
          </IconButton>
        </Box>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        open={anchorEl !== null}
        slotProps={ROUNDED_PAPER_SLOT_PROPS}
      >
        {item.options.map((option) => (
          <MenuItem
            aria-label={option.label}
            key={option.value}
            onClick={() => {
              setAnchorEl(null);
              item.onChange(editor, option.value);
            }}
            selected={option.value === value}
            title={option.markers === undefined ? undefined : option.label}
          >
            {option.swatch === undefined ? null : (
              <Box
                sx={{
                  bgcolor: option.swatch,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 0.5,
                  height: 16,
                  mr: 1,
                  width: 16,
                }}
              />
            )}
            {option.markers === undefined ? (
              <ListItemText
                primary={option.label}
                slotProps={{ primary: { sx: option.labelSx } }}
              />
            ) : (
              <ListMarkersPreview markers={option.markers} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

interface ColorButtonProps {
  readonly editor: TiptapEditor;
  readonly item: ColorPickerToolbarItemSpec;
  readonly disabled: boolean;
}

function ColorButton({ editor, item, disabled }: ColorButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const current = item.getValue(editor);

  return (
    <>
      <Tooltip title={item.label}>
        <Box component="span" sx={{ display: "inline-flex" }}>
          <IconButton
            aria-haspopup="dialog"
            aria-label={item.label}
            disabled={disabled}
            onClick={(event) => setAnchorEl(event.currentTarget)}
            size="small"
            sx={iconButtonSx}
          >
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <ItemIcon icon={item.icon} />
              <Box
                data-testid={`${item.key}-indicator`}
                sx={{
                  bgcolor: current ?? "action.disabled",
                  borderRadius: 0.25,
                  height: 3,
                  mt: 0.25,
                  width: 16,
                }}
              />
            </Box>
          </IconButton>
        </Box>
      </Tooltip>
      <ToolbarColorPicker
        anchorEl={anchorEl}
        current={current}
        item={item}
        onClose={() => setAnchorEl(null)}
        onPick={(color) => {
          setAnchorEl(null);
          item.onChange(editor, color);
        }}
      />
    </>
  );
}

export function Toolbar({ editor, items, leading, trailing }: ToolbarProps) {
  const [openDialogKey, setOpenDialogKey] = useState<string>();

  return (
    <MuiToolbar
      aria-label="Formatação do editor"
      disableGutters
      role="toolbar"
      variant="dense"
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        flexWrap: "wrap",
        gap: 0.5,
        px: 1,
      }}
    >
      {leading}
      {items.map((item) => {
        const disabled = item.isDisabled?.(editor) ?? false;

        switch (item.type) {
          case "toggle": {
            const active = item.isActive(editor);

            return (
              <Tooltip key={item.key} title={item.label}>
                <Box component="span" sx={{ display: "inline-flex" }}>
                  <IconButton
                    aria-label={item.label}
                    aria-pressed={active}
                    color={active ? "primary" : "default"}
                    disabled={disabled}
                    onClick={() => item.onClick(editor)}
                    size="small"
                    sx={{
                      ...iconButtonSx,
                      bgcolor: active ? "action.selected" : undefined,
                    }}
                  >
                    <ItemIcon icon={item.icon} />
                  </IconButton>
                </Box>
              </Tooltip>
            );
          }

          case "menu":
            return (
              <MenuButton
                disabled={disabled}
                editor={editor}
                item={item}
                key={item.key}
              />
            );

          case "colorPicker":
            return (
              <ColorButton
                disabled={disabled}
                editor={editor}
                item={item}
                key={item.key}
              />
            );

          case "dialog": {
            const open = openDialogKey === item.key;
            const Dialog = item.component;

            return (
              <Suspense
                fallback={<CircularProgress key={item.key} size={24} />}
                key={item.key}
              >
                <Tooltip title={item.label}>
                  <Box component="span" sx={{ display: "inline-flex" }}>
                    <IconButton
                      aria-label={item.label}
                      color={item.isActive?.(editor) ? "primary" : "default"}
                      disabled={disabled}
                      onClick={() => setOpenDialogKey(item.key)}
                      size="small"
                      sx={iconButtonSx}
                    >
                      <ItemIcon icon={item.icon} />
                    </IconButton>
                  </Box>
                </Tooltip>
                {open ? (
                  <Dialog
                    editor={editor}
                    onClose={() => setOpenDialogKey(undefined)}
                    open
                  />
                ) : null}
              </Suspense>
            );
          }
        }
      })}
      {trailing}
    </MuiToolbar>
  );
}
