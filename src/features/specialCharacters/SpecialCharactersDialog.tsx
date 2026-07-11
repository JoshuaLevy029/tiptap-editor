import { Icon } from "@iconify/react";
import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  InputBase,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { ToolbarDialogProps } from "../types";
import { ROUNDED_PAPER_SLOT_PROPS } from "../../ui";
import type { SpecialCharacterSet } from "./helpers";

export interface SpecialCharactersDialogProps extends ToolbarDialogProps {
  readonly sets: readonly SpecialCharacterSet[];
}

function filterSets(
  sets: readonly SpecialCharacterSet[],
  query: string,
): readonly SpecialCharacterSet[] {
  const needle = query.trim().toLowerCase();

  if (needle.length === 0) {
    return sets;
  }

  return sets.flatMap((set) => {
    if (set.label.toLowerCase().includes(needle)) {
      return [set];
    }

    const characters = set.characters.filter(
      (character) =>
        character.label.toLowerCase().includes(needle) ||
        character.value.includes(needle),
    );

    return characters.length === 0 ? [] : [{ ...set, characters }];
  });
}

export default function SpecialCharactersDialog({
  editor,
  onClose,
  open,
  sets,
}: SpecialCharactersDialogProps) {
  const [query, setQuery] = useState("");
  const [lastInserted, setLastInserted] = useState<string>();
  const visibleSets = useMemo(() => filterSets(sets, query), [query, sets]);

  const insertCharacter = (value: string) => {
    if (editor.chain().insertContent(value).run()) {
      setLastInserted(value);
    }
  };

  return (
    <Dialog
      aria-label="Caracteres especiais"
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={open}
      slotProps={ROUNDED_PAPER_SLOT_PROPS}
    >
      <Box sx={{ px: 3, pt: 3 }}>
        <Box
          sx={{
            alignItems: "center",
            border: 1,
            borderColor: "divider",
            borderRadius: 2.5,
            display: "flex",
            gap: 1.5,
            px: 2,
            py: 1,
          }}
        >
          <Box sx={{ color: "warning.main", display: "inline-flex" }}>
            <Icon fontSize={18} icon="material-symbols:search" />
          </Box>
          <InputBase
            autoFocus
            fullWidth
            inputProps={{ "aria-label": "Buscar caracteres" }}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busque por categoria: grego, setas, moedas, frações…"
            value={query}
          />
        </Box>
      </Box>
      <DialogContent sx={{ maxHeight: 420 }}>
        {visibleSets.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4 }} variant="body2">
            Nada encontrado para “{query}”.
          </Typography>
        ) : (
          visibleSets.map((set) => (
            <Box key={set.label} sx={{ mb: 2.5 }}>
              <Typography
                sx={{
                  color: "text.disabled",
                  display: "block",
                  fontFamily: "monospace",
                  letterSpacing: 1.5,
                  mb: 1,
                  textTransform: "uppercase",
                }}
                variant="caption"
              >
                {set.label}
              </Typography>
              <Box
                aria-label={`Caracteres: ${set.label}`}
                sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
              >
                {set.characters.map((character) => (
                  <Tooltip
                    key={`${character.label}-${character.value}`}
                    title={character.label}
                  >
                    <ButtonBase
                      aria-label={`Inserir ${character.label}`}
                      onClick={() => insertCharacter(character.value)}
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        fontSize: "1.05rem",
                        height: 44,
                        minWidth: 44,
                        px: 1,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      {character.value}
                    </ButtonBase>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions
        sx={{ justifyContent: "space-between", px: 3, py: 1.5 }}
      >
        <Typography
          aria-live="polite"
          color="text.secondary"
          variant="body2"
        >
          {lastInserted === undefined ? " " : "Inserido: "}
          {lastInserted === undefined ? null : (
            <Box
              component="span"
              sx={{ color: "warning.main", fontWeight: 600 }}
            >
              {lastInserted}
            </Box>
          )}
        </Typography>
        <Button color="inherit" onClick={onClose} sx={{ textTransform: "none" }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
