# Feature modules

Each catalog feature owns a folder at `src/features/<key>/`. Its `index.ts`
exports one named module (`<key>Feature`). Dialogs, helpers, and tests stay in
that same folder. `src/features/index.ts` imports those modules and lists them in
the exact catalog order.

`Editor.tsx` owns only the required `Document`, `Paragraph`, and `Text` schema
primitives. Feature modules do not register those names again; for example,
`textType` contributes `Heading` plus its paragraph/heading selector.

Configured features use their public config type:

```ts
import TiptapImage from "@tiptap/extension-image";
import { lazy } from "react";
import type { ImageFeatureConfig } from "../../types";
import { defineFeature, resolveFeatureFlag } from "../types";

const ImageDialog = lazy(() => import("./ImageDialog"));

const DEFAULT_CONFIG: ImageFeatureConfig = {
  accept: ["image/png", "image/jpeg", "image/webp", "image/gif"],
};

export const imageFeature = defineFeature<"image", ImageFeatureConfig>({
  key: "image",
  defaultEnabled: true,
  resolveConfig: (flag) =>
    resolveFeatureFlag(flag, () => ({ ...DEFAULT_CONFIG })),
  extensions: () => [TiptapImage],
  toolbarItems: () => [
    {
      type: "dialog",
      key: "image",
      label: "Imagem",
      icon: "lucide:image",
      component: ImageDialog,
    },
  ],
});
```

Features without public configuration use `EmptyFeatureConfig` and return a
fresh `{}` from their defaults factory. A `false` flag must resolve to `null`;
only resolved modules may contribute extensions, toolbar items, or shortcuts.

Toolbar actions operate on the current selection/cursor through Tiptap commands
(normally `editor.chain().focus()...run()`). They must never select, traverse, or
rewrite the entire document to apply formatting. Dialog code is exposed through
`lazy(() => import("./FeatureDialog"))` in the toolbar item so it loads only when
opened.
