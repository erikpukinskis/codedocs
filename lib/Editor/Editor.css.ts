import { style } from "@vanilla-extract/css"

export const editorContainer = style({
  // TODO: Make this some variant of full page height minus the chrome
  minHeight: 100,
})

export const editor = style({
  ":focus-visible": {
    outline: "none",
  },
})

export const frozenBlock = style({
  userSelect: "none",
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
  textDecoration: "underline",
})

export const ghostSelection = style({
  outline: "1px solid red",
})
