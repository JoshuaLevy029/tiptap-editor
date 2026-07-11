import { ROUNDED_PAPER_SLOT_PROPS } from "../../ui";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { ToolbarDialogProps } from "../types";

export default function SourceCodeDialog({
  editor,
  onClose,
  open,
}: ToolbarDialogProps) {
  const [error, setError] = useState<string>();
  const [source, setSource] = useState("");

  useEffect(() => {
    if (open) {
      setError(undefined);
      setSource(editor.getHTML());
    }
  }, [editor, open]);

  const confirm = () => {
    try {
      const updated = editor.chain().focus().setContent(source).run();

      if (!updated) {
        setError("Não foi possível aplicar o HTML informado.");
        return;
      }

      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível interpretar o HTML informado.",
      );
    }
  };

  return (
    <Dialog slotProps={ROUNDED_PAPER_SLOT_PROPS} fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>Editar código-fonte HTML</DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <TextField
          autoFocus
          fullWidth
          label="HTML do documento"
          minRows={14}
          multiline
          onChange={(event) => {
            setError(undefined);
            setSource(event.target.value);
          }}
          value={source}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={confirm} variant="contained">
          Aplicar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
