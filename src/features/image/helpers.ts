import type { Editor as TiptapEditor } from "@tiptap/react";
import type { ImageFeatureConfig } from "../../types";

export const DEFAULT_IMAGE_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export interface ResolvedImageFeatureConfig {
  readonly accept: readonly string[];
  readonly maxSizeBytes?: number;
  readonly onUpload?: (file: File) => Promise<string>;
  readonly onUploadError?: (error: Error, file: File) => void;
}

interface PendingImageNode {
  readonly attrs: Record<string, unknown>;
  readonly nodeSize: number;
  readonly position: number;
}

let nextUploadId = 0;

export function resolveImageConfig(
  config: ImageFeatureConfig = {},
): ResolvedImageFeatureConfig {
  return {
    accept: config.accept ? [...config.accept] : [...DEFAULT_IMAGE_ACCEPT],
    ...(config.maxSizeBytes === undefined
      ? {}
      : { maxSizeBytes: config.maxSizeBytes }),
    ...(config.onUpload === undefined ? {} : { onUpload: config.onUpload }),
    ...(config.onUploadError === undefined
      ? {}
      : { onUploadError: config.onUploadError }),
  };
}

function matchesAcceptRule(file: File, rule: string): boolean {
  const normalizedRule = rule.trim().toLowerCase();

  if (normalizedRule.startsWith(".")) {
    return file.name.toLowerCase().endsWith(normalizedRule);
  }

  if (normalizedRule.endsWith("/*")) {
    return file.type.toLowerCase().startsWith(normalizedRule.slice(0, -1));
  }

  return file.type.toLowerCase() === normalizedRule;
}

export function validateImageFile(
  file: File,
  config: ResolvedImageFeatureConfig,
): Error | null {
  if (
    config.accept.length > 0 &&
    !config.accept.some((rule) => matchesAcceptRule(file, rule))
  ) {
    return new Error("Formato de imagem não permitido.");
  }

  if (config.maxSizeBytes !== undefined && file.size > config.maxSizeBytes) {
    return new Error("A imagem excede o tamanho máximo permitido.");
  }

  return null;
}

export function createImageUploadId(): string {
  nextUploadId += 1;
  return `image-upload-${Date.now()}-${nextUploadId}`;
}

export function insertPendingImage(
  editor: TiptapEditor,
  uploadId: string,
): boolean {
  return editor
    .chain()
    .focus()
    .insertContent({
      type: "image",
      attrs: { src: null, uploading: true, uploadId },
    })
    .run();
}

function findPendingImage(
  editor: TiptapEditor,
  uploadId: string,
): PendingImageNode | undefined {
  let match: PendingImageNode | undefined;

  editor.state.doc.descendants((node, position) => {
    if (
      match === undefined &&
      node.type.name === "image" &&
      node.attrs.uploadId === uploadId
    ) {
      match = {
        attrs: node.attrs as Record<string, unknown>,
        nodeSize: node.nodeSize,
        position,
      };
    }

    return match === undefined;
  });

  return match;
}

function replacePendingImage(
  editor: TiptapEditor,
  uploadId: string,
  src: string,
): void {
  const pendingImage = findPendingImage(editor, uploadId);

  if (!pendingImage) {
    return;
  }

  const transaction = editor.state.tr
    .setNodeMarkup(pendingImage.position, undefined, {
      ...pendingImage.attrs,
      src,
      uploading: false,
      uploadId: null,
    })
    .setMeta("addToHistory", false);

  editor.view.dispatch(transaction);
}

function removePendingImage(editor: TiptapEditor, uploadId: string): void {
  const pendingImage = findPendingImage(editor, uploadId);

  if (!pendingImage) {
    return;
  }

  const transaction = editor.state.tr
    .delete(
      pendingImage.position,
      pendingImage.position + pendingImage.nodeSize,
    )
    .setMeta("addToHistory", false);

  editor.view.dispatch(transaction);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(reader.error ?? new Error("Não foi possível ler a imagem."));
    };
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Não foi possível converter a imagem para base64."));
      }
    };
    reader.readAsDataURL(file);
  });
}

export async function resolveImageSource(
  file: File,
  config: ResolvedImageFeatureConfig,
): Promise<string> {
  const src = config.onUpload
    ? await config.onUpload(file)
    : await fileToDataUrl(file);

  if (src.trim().length === 0) {
    throw new Error("O upload não retornou uma origem válida para a imagem.");
  }

  return src;
}

function toError(cause: unknown): Error {
  return cause instanceof Error
    ? cause
    : new Error("Falha ao enviar a imagem.");
}

export async function resolvePendingImage(
  editor: TiptapEditor,
  uploadId: string,
  file: File,
  config: ResolvedImageFeatureConfig,
): Promise<void> {
  try {
    const src = await resolveImageSource(file, config);
    replacePendingImage(editor, uploadId, src);
  } catch (cause) {
    const error = toError(cause);
    removePendingImage(editor, uploadId);
    config.onUploadError?.(error, file);
  }
}
