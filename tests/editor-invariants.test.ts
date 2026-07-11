import StarterKit from "@tiptap/starter-kit";
import { Editor as TiptapEditor } from "@tiptap/react";
import { afterEach, describe, expect, it } from "vitest";
import { resolveFeatures } from "../src/Editor";
import { REGISTRY } from "../src/features";
import { boldFeature } from "../src/features/bold";
import {
  resolveImageConfig,
  resolveImageSource,
} from "../src/features/image/helpers";
import type { EditorFeatures } from "../src/types";

const editors: TiptapEditor[] = [];

afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy());
});

function allFeaturesDisabled(): EditorFeatures {
  return Object.fromEntries(
    REGISTRY.map((feature) => [feature.key, false]),
  ) as EditorFeatures;
}

describe("feature registry", () => {
  it("follows the catalog order", () => {
    expect(REGISTRY.map((feature) => feature.key)).toEqual([
      "textType",
      "bold",
      "italic",
      "bulletList",
      "orderedList",
      "indent",
      "columns",
      "image",
      "table",
      "undoRedo",
      "textAlign",
      "lineHeight",
      "backgroundColor",
      "textColor",
      "fontFamily",
      "fontSize",
      "highlight",
      "specialCharacters",
      "strike",
      "underline",
      "subscript",
      "superscript",
      "sourceCode",
      "math",
      "chemistry",
    ]);
  });

  it("does not load extensions or toolbar items from disabled features", () => {
    const disabled = resolveFeatures(allFeaturesDisabled());

    expect(disabled.extensions).toEqual([]);
    expect(disabled.toolbarItems).toEqual([]);

    const boldOnly = resolveFeatures({
      ...allFeaturesDisabled(),
      bold: true,
    });

    expect(boldOnly.extensions.map((extension) => extension.name)).toEqual([
      "bold",
    ]);
    expect(boldOnly.toolbarItems.map((item) => item.key)).toEqual(["bold"]);
  });
});

describe("SPEC 4.0", () => {
  it("applies bold exactly to the current text selection", () => {
    const config = boldFeature.resolveConfig(true);

    if (config === null) {
      throw new Error("A feature bold deve estar ativa no teste.");
    }

    const editor = new TiptapEditor({
      content: "<p>alpha beta</p>",
      extensions: [
        StarterKit.configure({ bold: false }),
        ...boldFeature.extensions(config),
      ],
    });
    editors.push(editor);
    editor.commands.setTextSelection({ from: 1, to: 6 });

    const item = boldFeature.toolbarItems(config)[0];

    if (item?.type !== "toggle") {
      throw new Error("Item de toolbar bold ausente.");
    }

    item.onClick(editor);

    expect(editor.getJSON()).toMatchObject({
      content: [
        {
          content: [
            { marks: [{ type: "bold" }], text: "alpha", type: "text" },
            { text: " beta", type: "text" },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    });
  });
});

describe("default image upload", () => {
  it("converts the file to a base64 data URL when onUpload is omitted", async () => {
    const file = new File(["image"], "tiny.png", { type: "image/png" });

    await expect(resolveImageSource(file, resolveImageConfig())).resolves.toBe(
      "data:image/png;base64,aW1hZ2U=",
    );
  });
});
