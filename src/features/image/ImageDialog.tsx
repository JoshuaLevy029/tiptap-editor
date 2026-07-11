import { Icon } from "@iconify/react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputBase,
  Typography,
} from "@mui/material";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import type { ToolbarDialogProps } from "../types";
import { ROUNDED_PAPER_SLOT_PROPS } from "../../ui";
import {
  createImageUploadId,
  insertPendingImage,
  resolvePendingImage,
  type ResolvedImageFeatureConfig,
  validateImageFile,
} from "./helpers";

export interface ImageDialogProps extends ToolbarDialogProps {
  readonly config: ResolvedImageFeatureConfig;
}

function normalizeImageUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export default function ImageDialog({
  config,
  editor,
  onClose,
  open,
}: ImageDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState("");
  const [urlFailed, setUrlFailed] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const normalizedUrl = normalizeImageUrl(url);
  const fileUrl = useMemo(
    () =>
      file !== undefined && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(file)
        : undefined,
    [file],
  );

  useEffect(
    () => () => {
      if (fileUrl !== undefined) {
        URL.revokeObjectURL(fileUrl);
      }
    },
    [fileUrl],
  );

  const previewSrc = fileUrl ?? (normalizedUrl ?? undefined);
  const canConfirm =
    file !== undefined || (normalizedUrl !== null && !urlFailed);

  const acceptFile = (candidate: File) => {
    const validationError = validateImageFile(candidate, config);

    if (validationError) {
      setFile(undefined);
      setErrorMessage(validationError.message);
      config.onUploadError?.(validationError, candidate);
      return;
    }

    setErrorMessage(undefined);
    setUrl("");
    setUrlFailed(false);
    setFile(candidate);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];

    if (nextFile) {
      acceptFile(nextFile);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];

    if (dropped) {
      acceptFile(dropped);
    }
  };

  const handleConfirm = () => {
    if (file !== undefined) {
      const uploadId = createImageUploadId();

      if (!insertPendingImage(editor, uploadId)) {
        setErrorMessage("Não foi possível inserir a imagem.");
        return;
      }

      onClose();
      void resolvePendingImage(editor, uploadId, file, config).catch(
        () => undefined,
      );
      return;
    }

    if (normalizedUrl === null) {
      setErrorMessage("Informe uma URL HTTP ou HTTPS válida.");
      return;
    }

    const inserted = editor
      .chain()
      .focus()
      .insertContent({ attrs: { src: normalizedUrl }, type: "image" })
      .run();

    if (inserted) {
      onClose();
    } else {
      setErrorMessage("Não foi possível inserir a imagem.");
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
      slotProps={ROUNDED_PAPER_SLOT_PROPS}
    >
      <DialogTitle
        sx={{
          alignItems: "baseline",
          display: "flex",
          fontWeight: 600,
          justifyContent: "space-between",
        }}
      >
        Inserir imagem
        <Typography
          sx={{ color: "text.disabled", fontFamily: "monospace" }}
          variant="caption"
        >
          URL · arquivo
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          aria-label="Palco da imagem — solte um arquivo aqui"
          onDragLeave={() => setDragActive(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDrop={handleDrop}
          sx={{
            alignItems: "center",
            bgcolor: dragActive ? "action.hover" : "transparent",
            border: "2px dashed",
            borderColor: dragActive ? "primary.main" : "divider",
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            justifyContent: "center",
            minHeight: 260,
            p: 2,
          }}
        >
          {previewSrc !== undefined && !urlFailed ? (
            <Box
              alt="Pré-visualização da imagem"
              component="img"
              onError={() => {
                if (file === undefined) {
                  setUrlFailed(true);
                }
              }}
              src={previewSrc}
              sx={{
                maxHeight: 236,
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <>
              <Box
                sx={{ color: "warning.main", display: "inline-flex" }}
              >
                <Icon fontSize={40} icon="material-symbols:image-outline" />
              </Box>
              <Typography color="text.secondary" variant="body2">
                {urlFailed
                  ? "Não foi possível carregar a imagem desta URL."
                  : "A imagem aparece aqui — solte um arquivo neste palco"}
              </Typography>
            </>
          )}
        </Box>

        <Box
          sx={{
            alignItems: "center",
            border: 1,
            borderColor: "divider",
            borderRadius: 2.5,
            display: "flex",
            gap: 1.5,
            mt: 2,
            pl: 2,
            pr: 1,
            py: 0.75,
          }}
        >
          <Icon fontSize={18} icon="material-symbols:link" />
          <InputBase
            fullWidth
            inputProps={{ "aria-label": "URL da imagem" }}
            onChange={(event) => {
              setFile(undefined);
              setUrlFailed(false);
              setErrorMessage(undefined);
              setUrl(event.target.value);
            }}
            placeholder="Cole um URL de imagem… o preview carrega sozinho"
            sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
            value={file !== undefined ? file.name : url}
          />
          <Button
            component="label"
            size="small"
            sx={{
              borderRadius: 99,
              flexShrink: 0,
              px: 2,
              textTransform: "none",
            }}
            variant="contained"
          >
            Procurar…
            <Box
              accept={config.accept.join(",")}
              component="input"
              hidden
              onChange={handleFileChange}
              type="file"
            />
          </Button>
        </Box>

        {errorMessage ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          disabled={!canConfirm}
          onClick={handleConfirm}
          sx={{ borderRadius: 2, px: 3, textTransform: "none" }}
          variant="contained"
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
