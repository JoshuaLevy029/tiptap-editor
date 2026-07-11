import { backgroundColorFeature } from "./backgroundColor";
import { boldFeature } from "./bold";
import { bulletListFeature } from "./bulletList";
import { chemistryFeature } from "./chemistry";
import { fontFamilyFeature } from "./fontFamily";
import { fontSizeFeature } from "./fontSize";
import { highlightFeature } from "./highlight";
import { imageFeature } from "./image";
import { columnsFeature } from "./columns";
import { indentFeature } from "./indent";
import { lineHeightFeature } from "./lineHeight";
import { italicFeature } from "./italic";
import { mathFeature } from "./math";
import { orderedListFeature } from "./orderedList";
import { sourceCodeFeature } from "./sourceCode";
import { specialCharactersFeature } from "./specialCharacters";
import { strikeFeature } from "./strike";
import { subscriptFeature } from "./subscript";
import { superscriptFeature } from "./superscript";
import { tableFeature } from "./table";
import { textAlignFeature } from "./textAlign";
import { textColorFeature } from "./textColor";
import { textTypeFeature } from "./textType";
import { underlineFeature } from "./underline";
import { undoRedoFeature } from "./undoRedo";
import type { FeatureModule } from "./types";

export { applyUiOverrides } from "./uiOverrides";
export type { EditorUiOverrides, ToolbarItemOverride } from "./uiOverrides";

/**
 * Feature modules are registered in toolbar/catalog order.
 *
 * Catalog order required by SPEC section 4:
 * 01. textType
 * 02. bold
 * 03. italic
 * 04. bulletList
 * 05. orderedList
 * 06. indent
 * 07. image
 * 08. table
 * 09. undoRedo
 * 10. textAlign
 * 11. backgroundColor
 * 12. textColor
 * 13. fontFamily
 * 14. fontSize
 * 15. highlight
 * 16. specialCharacters
 * 17. strike
 * 18. underline
 * 19. subscript
 * 20. superscript
 * 21. sourceCode
 * 22. math
 * 23. chemistry
 */
export const REGISTRY: readonly FeatureModule[] = [
  textTypeFeature,
  boldFeature,
  italicFeature,
  bulletListFeature,
  orderedListFeature,
  indentFeature,
  columnsFeature,
  imageFeature,
  tableFeature,
  undoRedoFeature,
  textAlignFeature,
  lineHeightFeature,
  backgroundColorFeature,
  textColorFeature,
  fontFamilyFeature,
  fontSizeFeature,
  highlightFeature,
  specialCharactersFeature,
  strikeFeature,
  underlineFeature,
  subscriptFeature,
  superscriptFeature,
  sourceCodeFeature,
  mathFeature,
  chemistryFeature,
];

export type {
  ColorPickerToolbarItemSpec,
  DialogToolbarItemSpec,
  EmptyFeatureConfig,
  FeatureKey,
  FeatureFloatingProps,
  FeatureModule,
  MenuToolbarItemOption,
  MenuToolbarItemSpec,
  ToggleToolbarItemSpec,
  ToolbarDialogProps,
  ToolbarIcon,
  ToolbarItemSpec,
} from "./types";

export { defineFeature, resolveFeatureFlag } from "./types";
