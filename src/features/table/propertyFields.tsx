import { Icon } from "@iconify/react";
import {
  Box,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { TableBorderStyle } from "./tableStyles";

export const BORDER_STYLE_OPTIONS: ReadonlyArray<{
  label: string;
  value: TableBorderStyle | "";
}> = [
  { label: "Herdada", value: "" },
  { label: "Sem borda", value: "none" },
  { label: "Sólida", value: "solid" },
  { label: "Tracejada", value: "dashed" },
  { label: "Pontilhada", value: "dotted" },
];

export function SectionLabel({ children }: { readonly children: string }) {
  return (
    <Typography sx={{ fontWeight: 600, mb: 0.75 }} variant="body2">
      {children}
    </Typography>
  );
}

interface ColorFieldProps {
  readonly label: string;
  readonly onChange: (value: string | null) => void;
  readonly value: string | null;
}

export function ColorField({ label, onChange, value }: ColorFieldProps) {
  return (
    <Box
      sx={{
        alignItems: "center",
        border: 1,
        borderColor: "divider",
        borderRadius: 1.5,
        display: "flex",
        flex: 1,
        gap: 1,
        pl: 1.25,
        pr: 0.5,
        py: 0.25,
      }}
    >
      <Typography
        sx={{ color: "text.secondary", flex: 1 }}
        variant="body2"
      >
        {label}
      </Typography>
      <Box
        aria-label={label}
        component="input"
        onChange={(event) => onChange(event.currentTarget.value)}
        sx={{
          border: 0,
          borderRadius: 1,
          cursor: "pointer",
          height: 24,
          p: 0,
          width: 28,
        }}
        type="color"
        value={value ?? "#ffffff"}
      />
      <Tooltip title="Remover cor">
        <IconButton
          aria-label={`Remover ${label.toLowerCase()}`}
          onClick={() => onChange(null)}
          size="small"
        >
          <Icon fontSize={16} icon="material-symbols:format-color-reset" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

interface BorderFieldsProps {
  readonly color: string | null;
  readonly onChange: (patch: {
    borderColor?: string | null;
    borderStyle?: TableBorderStyle | null;
    borderWidth?: string | null;
  }) => void;
  readonly style: TableBorderStyle | null;
  readonly width: string | null;
}

export function BorderFields({
  color,
  onChange,
  style,
  width,
}: BorderFieldsProps) {
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <TextField
        label="Estilo"
        onChange={(event) =>
          onChange({
            borderStyle:
              event.target.value === ""
                ? null
                : (event.target.value as TableBorderStyle),
          })
        }
        select
        size="small"
        sx={{ minWidth: 120 }}
        value={style ?? ""}
      >
        {BORDER_STYLE_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <ColorField
        label="Cor"
        onChange={(value) => onChange({ borderColor: value })}
        value={color}
      />
      <TextField
        label="Largura"
        onChange={(event) =>
          onChange({
            borderWidth:
              event.target.value.trim() === "" ? null : event.target.value,
          })
        }
        placeholder="1px"
        size="small"
        sx={{ width: 90 }}
        value={width ?? ""}
      />
    </Box>
  );
}
