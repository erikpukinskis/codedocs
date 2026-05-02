import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

/**
 * variantContent — the per-variant CSS Grid that hosts everything for one demo variant.
 *
 * Why a grid even though we only have ONE explicit cell:
 *
 *   The grid is here to scope the crop marks. CropMarks gets grid-row:1,
 *   grid-column:1 so its containing block is the cell rather than the
 *   grid container's padding box — meaning inset:0 frames exactly the demo
 *   content area. EventLog has no grid placement and uses position:absolute
 *   relative to the variantContent's padding box, which is what we want for
 *   its transient overlay behaviour.
 *
 *   Tabs are NOT in this grid. They are rendered by FrozenBlockElement
 *   (in Editor.tsx), positioned at the bottom-right of the frozenBlock
 *   (which is already position:relative). This avoids the need for any
 *   padding-bottom strip here.
 *
 * Why we use grid (block-level) and not inline-grid:
 *   - Multiple variants of the same demo need to stack on separate lines.
 *     Block-level grid does that. Inline-grid would lay variants out
 *     side-by-side. Shrink-wrapping for inline demos comes from width
 *     (max-content), not from the display mode.
 *
 * Width control:
 *   - Inline demos: width:max-content + minmax(0, max-content) column track,
 *     so the variant shrinks to its content. The frozen block (also inline-
 *     block) shrinks around it, and the paragraph caret leaf sits beside it.
 *   - Full-width demos: width:100% + 1fr column track, fills the frozen block,
 *     which fills the paragraph row.
 */
export const variantContent = recipe({
  base: {
    /**
     * Block-level grid (so multiple variants stack on their own lines).
     * Width is what differentiates inline vs full-width.
     */
    display: "grid",
    /**
     * One row, sized to the demo content. Source code does NOT live in
     * this grid — it's a sibling Slate block at the document level, naturally
     * below the paragraph that contains the demo.
     */
    gridTemplateRows: "max-content",
    /**
     * Required for EventLog: when a position:absolute child has NO grid
     * placement, its containing block is the grid container's padding box.
     * position:relative makes that work even outside grid-specific cases.
     */
    position: "relative",
    /**
     * The 12px top margin matches the crop-mark length + offset, so when one
     * variant stacks below another, the top crop marks of the lower variant
     * align with where the upper variant's bottom crop marks ended.
     */
    marginTop: 12,
  },
  variants: {
    fullWidth: {
      true: {
        /**
         * Fill the frozen block (which fills the paragraph row).
         * Single column at 1fr means the demo content cell stretches.
         */
        width: "100%",
        gridTemplateColumns: "1fr",
      },
      false: {
        /**
         * Shrink-wrap to the demo content. minmax(0, max-content) gives the
         * column a max-content size while still allowing it to shrink below
         * intrinsic minimum if its container is narrower (preventing overflow
         * in narrow editor panes).
         */
        width: "max-content",
        maxWidth: "100%",
        gridTemplateColumns: "minmax(0, max-content)",
      },
    },
  },
})

/**
 * demoContent — wraps {children}, the actual live render of the demo.
 *
 * Why this wrapper exists:
 *   - {children} can be multiple React elements; CSS Grid puts each direct
 *     child in its own cell. This wrapper makes the entire {children} subtree
 *     ONE grid item.
 *   - position:relative gives any position:absolute descendants of {children}
 *     a stable containing block (some demos rely on this).
 *   - It's where boundingSelectors padding sync is applied — that logic
 *     measures children that overflow visually (popovers, tooltips) and pads
 *     the wrapper so crop marks can frame them.
 */
export const demoContent = style({
  /**
   * Place this wrapper in row 1 / col 1. CropMarks shares this cell by
   * virtue of also being placed at row 1 / col 1, but as an absolute child
   * (so it overlays rather than sharing flow space).
   */
  gridRow: 1,
  gridColumn: 1,
  position: "relative",
  /**
   * minWidth:0 prevents the demo content from forcing the column wider than
   * necessary in cases where the column track was set to minmax(0, max-content).
   */
  minWidth: 0,
  /**
   * Above the cropMarks layer so demo paint sits over the marks.
   */
  isolation: "isolate",
  zIndex: 1,
})

/**
 * cropMarks — the corner-bracket frame that visually marks the demo's bounds.
 *
 * Why position:absolute WITH grid-row + grid-column:
 *   - The grid-row/grid-column placement gives this element the row-1 cell as
 *     its containing block (NOT the variantContent's padding box). With
 *     inset:0 the crop marks fill exactly the cell — the demo content area.
 *   - Being absolute means it doesn't push the cell larger or affect the
 *     grid's intrinsic sizing.
 */
export const cropMarks = style({
  position: "absolute",
  gridRow: 1,
  gridColumn: 1,
  inset: 0,
  /**
   * Below {children} in stacking order so demos can paint above the marks.
   * pointerEvents:none so the marks don't intercept clicks on demo content.
   */
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
