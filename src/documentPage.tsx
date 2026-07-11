import { Icon } from "@iconify/react";
import {
  Box,
  IconButton,
  MenuItem,
  Popover,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

export const PX_PER_CM = 37.7952756;

export interface PageSetup {
  readonly background: string | null;
  readonly format: PageFormatKey;
  readonly margins: { bottom: number; left: number; right: number; top: number };
  readonly orientation: "portrait" | "landscape";
}

export type PageFormatKey = "A4" | "Carta" | "Ofício";

export const PAGE_FORMATS: Record<
  PageFormatKey,
  { heightCm: number; widthCm: number }
> = {
  A4: { heightCm: 29.7, widthCm: 21 },
  Carta: { heightCm: 27.94, widthCm: 21.59 },
  "Ofício": { heightCm: 33.02, widthCm: 21.59 },
};

/**
 * Folha no formato do pipeline de conversão de apostilas (PDF → HTML):
 * article.page = 46rem de largura, padding 2.5rem 1.5rem, 16px/1.6.
 */
export const APOSTILA_SHEET = {
  fontSizePx: 16,
  lineHeight: 1.6,
  paddingPx: { bottom: 40, left: 24, right: 24, top: 40 },
  widthPx: 736,
} as const;

export const DEFAULT_PAGE_SETUP: PageSetup = {
  background: null,
  format: "A4",
  margins: { bottom: 2.54, left: 2.54, right: 2.54, top: 2.54 },
  orientation: "portrait",
};

export interface PageMetrics {
  readonly heightPx: number;
  readonly innerHeightPx: number;
  readonly paddingPx: {
    bottom: number;
    left: number;
    right: number;
    top: number;
  };
  readonly widthPx: number;
}

export function computePageMetrics(setup: PageSetup): PageMetrics {
  const format = PAGE_FORMATS[setup.format];
  const widthCm =
    setup.orientation === "portrait" ? format.widthCm : format.heightCm;
  const heightCm =
    setup.orientation === "portrait" ? format.heightCm : format.widthCm;
  const paddingPx = {
    bottom: setup.margins.bottom * PX_PER_CM,
    left: setup.margins.left * PX_PER_CM,
    right: setup.margins.right * PX_PER_CM,
    top: setup.margins.top * PX_PER_CM,
  };
  const heightPx = heightCm * PX_PER_CM;

  return {
    heightPx,
    innerHeightPx: heightPx - paddingPx.top - paddingPx.bottom,
    paddingPx,
    widthPx: widthCm * PX_PER_CM,
  };
}

interface MarginFieldProps {
  readonly label: string;
  readonly onChange: (value: number) => void;
  readonly value: number;
}

function MarginField({ label, onChange, value }: MarginFieldProps) {
  return (
    <TextField
      slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
      label={`${label} (cm)`}
      onChange={(event) => {
        const parsed = Number.parseFloat(event.target.value);

        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 8) {
          onChange(parsed);
        }
      }}
      size="small"
      type="number"
      value={value}
    />
  );
}

interface PageSetupControlProps {
  readonly onChange: (setup: PageSetup) => void;
  readonly setup: PageSetup;
}

export function PageSetupControl({ onChange, setup }: PageSetupControlProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const patchMargins = (patch: Partial<PageSetup["margins"]>) =>
    onChange({ ...setup, margins: { ...setup.margins, ...patch } });

  return (
    <>
      <Tooltip title="Configuração da página">
        <IconButton
          aria-label="Configuração da página"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          size="small"
          sx={{ borderRadius: 1, mr: 1 }}
        >
          <Icon icon="material-symbols:contract-edit-outline" />
        </IconButton>
      </Tooltip>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        onClose={() => setAnchorEl(null)}
        open={anchorEl !== null}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 2, width: 320 } } }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        <Stack spacing={2}>
          <Typography sx={{ fontWeight: 600 }} variant="body2">
            Formato da página
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              label="Formato"
              onChange={(event) =>
                onChange({
                  ...setup,
                  format: event.target.value as PageFormatKey,
                })
              }
              select
              size="small"
              value={setup.format}
            >
              {Object.entries(PAGE_FORMATS).map(([key, dims]) => (
                <MenuItem key={key} value={key}>
                  {key} ({dims.widthCm} × {dims.heightCm} cm)
                </MenuItem>
              ))}
            </TextField>
            <ToggleButtonGroup
              exclusive
              onChange={(_event, value: PageSetup["orientation"] | null) => {
                if (value !== null) {
                  onChange({ ...setup, orientation: value });
                }
              }}
              size="small"
              value={setup.orientation}
            >
              <ToggleButton aria-label="Retrato" value="portrait">
                <Icon icon="material-symbols:crop-portrait-outline" />
              </ToggleButton>
              <ToggleButton aria-label="Paisagem" value="landscape">
                <Icon icon="material-symbols:crop-landscape-outline" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Typography sx={{ fontWeight: 600 }} variant="body2">
            Margens
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: "1fr 1fr",
            }}
          >
            <MarginField
              label="Superior"
              onChange={(top) => patchMargins({ top })}
              value={setup.margins.top}
            />
            <MarginField
              label="Inferior"
              onChange={(bottom) => patchMargins({ bottom })}
              value={setup.margins.bottom}
            />
            <MarginField
              label="Esquerda"
              onChange={(left) => patchMargins({ left })}
              value={setup.margins.left}
            />
            <MarginField
              label="Direita"
              onChange={(right) => patchMargins({ right })}
              value={setup.margins.right}
            />
          </Box>

          <Typography sx={{ fontWeight: 600 }} variant="body2">
            Cor de fundo da folha
          </Typography>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <Box
              aria-label="Cor de fundo da folha"
              component="input"
              onChange={(event) =>
                onChange({ ...setup, background: event.currentTarget.value })
              }
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                cursor: "pointer",
                height: 32,
                p: 0,
                width: 48,
              }}
              type="color"
              value={setup.background ?? "#ffffff"}
            />
            <Typography color="text.secondary" variant="caption">
              {setup.background ?? "Padrão (branca)"}
            </Typography>
            {setup.background !== null ? (
              <IconButton
                aria-label="Restaurar cor padrão"
                onClick={() => onChange({ ...setup, background: null })}
                size="small"
              >
                <Icon fontSize={16} icon="material-symbols:format-color-reset" />
              </IconButton>
            ) : null}
          </Box>
        </Stack>
      </Popover>
    </>
  );
}
