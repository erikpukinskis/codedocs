import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

export const cropMark = style({
  background: "#ccc",
  width: 1,
  height: 1,
  position: "absolute",
})

export const demoWithCode = style({
  /**
   * The top margin is set to exactly 8px + 4px, for the crop mark length + the
   * crop mark offset.
   *
   * This allows the crop marks from one variant to overlap the variant below
   * precisely, so they can be packed a little tighter.
   */
  marginTop: 12,
})

export const demoContainer = recipe({
  base: {
    position: "relative",
    maxWidth: "100%",
  },
  variants: {
    inline: {
      true: {
        display: "inline-block",
      },
      false: {
        width: "100%",
      },
    },
    hasPadding: {
      true: {
        paddingBottom: "calc(0.8em + 8px + 4px)",
      },
    },
  },
})

/**
 * This container positions the tabs all the way to the right edge of the demo.
 * However, it has a max-width of 100% to ensure it doesn't grow past the *left*
 * edge of the demo.
 *
 * Then, tabs element below gets whitespace: nowrap and is allowed to overflow.
 *
 * This means the tabs will, in most cases, be aligned to the right of the demo,
 * but if they're too wide to fit they'll stick out the right side rather than
 * the left.
 */
export const tabsContainer = style({
  position: "absolute",
  bottom: 0,
  right: 0,
  maxWidth: "100%",
})

export const tabs = style({
  whiteSpace: "nowrap",
  position: "relative",
  left: 0,
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-start",
  gap: 10,
})

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

    ":hover": {
      color: "#000",
    },
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
        ":hover": {
          color: "white",
        },
      },
    },
  },
})

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
