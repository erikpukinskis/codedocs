import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

/**
 * variantContent — the per-variant CSS Grid that hosts everything for one demo variant.
 *
 * Why a grid even though we only have ONE explicit cell:
 *
 *   The grid is here to scope the crop marks. Specifically, we want CropMarks
 *   to frame ONLY the demo content area — but Tabs (when shown) need to hang
 *   BELOW that frame, in a reserved padding-bottom area, so they appear
 *   visually outside the crop marks rather than inside.
 *
 *   CSS gives absolutely-positioned children of a grid container two
 *   different containing blocks depending on whether they have grid
 *   placement:
 *
 *     - WITH grid-row + grid-column set: containing block is that cell area.
 *     - WITHOUT them: containing block is the grid container's padding box
 *       (which INCLUDES the element's padding).
 *
 *   We use this asymmetry:
 *     - CropMarks has grid-row:1, grid-column:1, inset:0  →  fills the cell.
 *     - Tabs has no grid placement, bottom:0, right:0     →  lands in the
 *       padding-bottom area, below the cell.
 *     - EventLog has no grid placement (its existing CSS) →  same, ends up
 *       below the cell as a transient overlay.
 *
 *   Without the grid, CropMarks at inset:0 would extend over the tabs area.
 *   We'd have to add a wrapper around demoContent to bound the crop marks.
 *   The grid replaces that wrapper.
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
     * One row, sized to the demo content. The Code panel does NOT live in
     * this grid — it's a sibling Slate block at the document level, naturally
     * below the paragraph that contains the demo.
     */
    gridTemplateRows: "max-content",
    /**
     * Required for tabs and EventLog: when a position:absolute child has NO
     * grid placement, its containing block is the grid container's padding
     * box. position:relative makes that work even outside grid-specific
     * cases (e.g., for any absolute descendants of {children} that resolve
     * to this ancestor).
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
    isLast: {
      true: {
        /**
         * Bottom padding on the LAST variant only — reserves a strip BELOW
         * the row-1 cell for the tabs to live in. The tabs are absolute
         * children with no grid placement, so their containing block is this
         * variantContent's padding box (which includes this padding); their
         * bottom:0 lands them at the bottom of THAT box, in this strip.
         *
         * CropMarks has grid-row:1 placement, so its containing block is the
         * cell, NOT the padding box. CropMarks does not extend into this
         * strip. That's how the tabs end up visually outside the crop-marks
         * frame.
         */
        paddingBottom: "calc(0.8em + 8px + 4px)",
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
 *   - The grid-row/grid-column placement is what gives this element its
 *     containing block: the row-1 cell, NOT the variantContent's padding box.
 *     With inset:0 the crop marks fill exactly the cell — the demo content
 *     area — and stop short of the padding-bottom strip where the tabs live.
 *   - This is the asymmetry that makes the grid worthwhile here. Tabs do the
 *     OPPOSITE: no grid placement, so their containing block is the padding
 *     box, so they end up below the cell.
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
 * tabs — the row of buttons (Source, dependency1, dependency2, ...) that
 * sits visually below the crop-marks frame, hanging into the
 * variantContent's reserved bottom padding.
 *
 * Why this layout — and why we DELIBERATELY DO NOT set grid-row/grid-column:
 *   - We want the tabs to appear OUTSIDE the crop-marks frame, in the
 *     padding-bottom strip below the row-1 cell.
 *   - Absolute children of a grid container fall back to the grid container's
 *     PADDING BOX as their containing block when they have no grid
 *     placement. The padding box includes the padding-bottom strip.
 *   - So with no grid-row/grid-column, bottom:0 puts the tabs at the bottom
 *     of the padding box — i.e., in that reserved strip, below the cell.
 *   - If we DID set grid-row:1, grid-column:1, the containing block would
 *     become the cell itself (same as CropMarks), and bottom:0 would put
 *     the tabs at the cell's bottom — INSIDE the crop-marks frame instead
 *     of below it. (Don't add grid placement here. This is a known foot-gun.)
 */
export const tabs = style({
  position: "absolute",
  bottom: 0,
  right: 0,
  /**
   * Above cropMarks so the tabs are clickable and not painted over.
   */
  zIndex: 2,
  whiteSpace: "nowrap",
  display: "flex",
  flexDirection: "row",
  gap: 10,
  /**
   * If labels are wider than the demo, allow tabs to overflow to the right
   * (rather than wrap or push the demo wider).
   */
  maxWidth: "100%",
})

/**
 * tab — individual tab button. Visual styling unchanged from the previous
 * design; only its DOM placement (absolute child of the grid) changes.
 */
export const tab = recipe({
  base: {
    "zIndex": 1,
    "background": "none",
    "marginTop": 2,
    "paddingInline": 6,
    "paddingBlock": 4,
    "borderRadius": 4,
    "border": "none",
    "fontSize": "0.8em",
    "cursor": "pointer",
    "color": "#555",
    "textShadow": "0.3px 0 0 currentColor",
    ":hover": { color: "#000" },
  },
  variants: {
    active: {
      true: {
        "fontWeight": "bold",
        "textShadow": "none",
        "color": "white",
        "textDecorationColor": "white",
        "background": "#5f577d",
        "boxShadow": "0 10px 0 0 #5f577d",
        ":hover": { color: "white" },
      },
    },
  },
})

/**
 * (No eventLog export here — EventLog already has position:absolute and its
 * own styling in lib/EventLog.css.ts. It uses the variantContent's
 * position:relative as its containing block, with no grid placement, so it
 * overlays without affecting layout. It returns null when there are no events
 * and individual events fade out after 2s, so it's purely transient.)
 */

/**
 * skippedDemo — placeholder when a demo is marked skip:true.
 * (Unchanged from current implementation.)
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
