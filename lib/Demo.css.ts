import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

/**
 * variantContent — per-variant wrapper for one demo variant.
 *
 * position:relative establishes the containing block for CropMarks
 * (position:absolute, inset:0) and EventLog (position:absolute). Multiple
 * variants of the same demo stack as regular block siblings — each with its
 * own independent width and its own set of crop marks.
 *
 * Tabs are NOT rendered here. They are rendered by FrozenBlockElement in
 * Editor.tsx, positioned at the bottom-right of the frozenBlock (which is
 * already position:relative).
 *
 * Width control:
 *   - Inline demos: width:max-content so the variant shrinks to its content.
 *     The frozen block (inline-block) shrinks around it and the paragraph
 *     caret leaf sits beside it.
 *   - Full-width demos: width:100% fills the frozen block, which fills the
 *     paragraph row.
 */
export const variantContent = recipe({
  base: {
    position: "relative",
  },
  variants: {
    fullWidth: {
      true: {
        width: "100%",
      },
      false: {
        width: "max-content",
        maxWidth: "100%",
      },
    },
  },
})

/**
 * demoContent — wraps {children}, the actual live render of the demo.
 *
 * Why this wrapper exists:
 *   - position:relative gives any position:absolute descendants of {children}
 *     a stable containing block (some demos rely on this).
 *   - It's where boundingSelectors padding sync is applied — that logic
 *     measures children that overflow visually (popovers, tooltips) and pads
 *     the wrapper so crop marks can frame them.
 *   - zIndex:1 (on a positioned element) ensures demo paint stacks above the
 *     CropMarks layer (zIndex:0) within variantContent.
 */
export const demoContent = style({
  position: "relative",
  zIndex: 1,
  overflow: "visible",
})

/**
 * cropMarks — the corner-bracket frame that visually marks the demo's bounds.
 *
 * position:absolute + inset:0 fills the variantContent (which is
 * position:relative). zIndex:0 keeps it below demoContent (zIndex:1).
 * pointerEvents:none so the marks don't intercept clicks on demo content.
 */
export const cropMarks = style({
  position: "absolute",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
})

/**
 * skippedDemo — placeholder when a demo is marked skip:true.
 */
export const skippedDemo = style({
  background: "#ffbc2c",
  fontSize: "0.85em",
  color: "white",
  paddingInline: 14,
  paddingBlock: 10,
  borderRadius: 8,
  boxShadow: "0px 2px 10px 0px inset #ffa33c",
  borderBottom: "1px solid #ffd79d",
})

export const outdentIcon = style({
  position: "absolute",
  top: 13,
  left: -22,
})
