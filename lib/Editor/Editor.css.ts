import { globalStyle, style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

export const editorContainer = style({
  // TODO: Make this some variant of full page height minus the chrome
  minHeight: 100,
})

export const editor = style({
  ":focus-visible": {
    outline: "none",
  },
})

export const frozenBlock = recipe({
  base: {
    background: "white",
    position: "relative",
    display: "inline-block",
    width: "100%",
  },
  variants: {
    selected: {
      true: {
        filter:
          "contrast(0.8) brightness(0.78) sepia(1) saturate(1.05) hue-rotate(178deg)",
      },
    },
  },
})

// Slate’s void spacer defaults to height:0 and transparent text; a collapsed caret
// inside it is invisible. Scoped to our frozen wrapper via data-description.
globalStyle('[data-description="frozen block"] [data-slate-spacer]', {
  position: "relative",
  height: "auto",
  minHeight: "1.2em",
  lineHeight: 1.2,
  color: "#222",
  verticalAlign: "top",
})

/**
 * Code Blocks own a two-column grid: "max-content 1fr". The max-content column
 * sizes to the widest line number in the block, so single-digit blocks get a
 * narrow gutter and it grows naturally for 2-digit numbers, etc.
 */
export const codeBlock = style({
  fontFamily: "monospace",
  whiteSpace: "pre",
  backgroundColor: "#ede8ff",
  color: "#6b54c0",
  fontSize: "0.85em",
  display: "grid",
  gridTemplateColumns: "max-content 1fr",
})

/**
 * Each Code Line spans both columns (grid-column: 1 / -1) and uses
 * grid-template-columns: subgrid to inherit the parent's column tracks.
 */
export const codeLine = style({
  display: "grid",
  gridColumn: "1 / -1",
  gridTemplateColumns: "subgrid",
})

export const lineNumber = style({
  fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  backgroundColor: "#e2daff",
  color: "#a696ff",
  textAlign: "center",
  paddingInline: "1em",
  marginRight: "0.5em",
  userSelect: "none",
})

export const link = style({
  "textDecoration": "underline",
  ":hover": {
    backgroundColor: "#ede8ff",
  },
})

export const ghostSelection = style({
  backgroundColor: "rgba(0,0,0,0.1)",
})

/** Empty text leaves have no box; browsers often hide the caret. Used in renderLeaf. */
export const emptyTextLeaf = style({
  display: "inline-block",
  minHeight: "1.2em",
  minWidth: "0.05em",
  verticalAlign: "top",
})
