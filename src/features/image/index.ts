import TiptapImage from "@tiptap/extension-image";
import { mergeAttributes, ReactNodeViewRenderer } from "@tiptap/react";
import {
  createElement,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import type { ImageFeatureConfig } from "../../types";
import { defineFeature, type ToolbarDialogProps } from "../types";
import { resolveImageConfig, type ResolvedImageFeatureConfig } from "./helpers";
import {
  imageAlignStyle,
  imageAttrsFromElement,
  parseImageAlign,
} from "./imageMarkup";
import { ImageNodeView } from "./ImageNodeView";

const UploadAwareImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: { default: "center" },
      caption: { default: null },
      width: { default: null },
      uploading: { default: false, rendered: false },
      uploadId: { default: null, rendered: false },
    };
  },
  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element) => imageAttrsFromElement(element as HTMLElement),
      },
      {
        tag: "img[src]",
        getAttrs: (element) => imageAttrsFromElement(element as HTMLElement),
      },
    ];
  },
  renderHTML({ node }) {
    const align = parseImageAlign(node.attrs.align);
    const caption =
      typeof node.attrs.caption === "string" ? node.attrs.caption : null;
    const img: [string, Record<string, unknown>] = [
      "img",
      mergeAttributes(this.options.HTMLAttributes, {
        alt: node.attrs.alt,
        "data-align": align,
        src: node.attrs.src,
        style: caption === null ? imageAlignStyle(align) : "max-width:100%;",
        title: node.attrs.title,
        width: node.attrs.width,
      }),
    ];

    if (caption === null) {
      return img;
    }

    return [
      "figure",
      {
        "data-align": align,
        style: `${imageAlignStyle(align)}width:fit-content;`,
      },
      img,
      ["figcaption", {}, caption],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

function createImageDialog(
  config: ResolvedImageFeatureConfig,
): LazyExoticComponent<ComponentType<ToolbarDialogProps>> {
  return lazy(async () => {
    const { default: ImageDialog } = await import("./ImageDialog");

    return {
      default: (props: ToolbarDialogProps) =>
        createElement(ImageDialog, { ...props, config }),
    };
  });
}

export const imageFeature = defineFeature<"image", ResolvedImageFeatureConfig>({
  key: "image",
  defaultEnabled: true,
  resolveConfig: (flag) => {
    if (flag === false) {
      return null;
    }

    const config: ImageFeatureConfig =
      flag === true || flag === undefined ? {} : flag;
    return resolveImageConfig(config);
  },
  extensions: () => [UploadAwareImage.configure({ allowBase64: true })],
  toolbarItems: (config) => [
    {
      type: "dialog",
      key: "image",
      label: "Imagem",
      icon: "lucide:image",
      component: createImageDialog(config),
    },
  ],
});
