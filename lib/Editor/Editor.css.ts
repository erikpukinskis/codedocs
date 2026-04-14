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

/**
 * Paragraphs that contain an inline frozen block: flex row keeps the caret leaf
 * on the same line as the demo (width:100% inline-block would force a line break above).
 */
export const paragraphWithFrozen = style({
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  flexWrap: "nowrap",
  marginTop: "1em",
})

export const frozenBlock = recipe({
  base: {
    background: "white",
    position: "relative",
  },
  variants: {
    selected: {
      true: {
        filter:
          "contrast(0.8) brightness(0.78) sepia(1) saturate(1.05) hue-rotate(178deg)",
      },
    },
    fullWidth: {
      true: {
        flex: "1 1 0%",
        minWidth: 0,
        alignSelf: "stretch",
        display: "block",
      },
      false: {
        display: "inline-block",
        flex: "0 1 auto",
      },
    },
  },
  defaultVariants: {
    fullWidth: false,
  },
})

globalStyle(
  '[data-description="frozen block"] [data-slate-spacer]::selection',
  {
    background: "transparent",
  }
)

/**
 * These are stuck at the end of Slate blocks, and have to be there so the
 * cursor has somewhere to go. However when selected they kind of stick out, so
 * we make the selection background transparent.
 */
export const emptyTextLeaf = style({
  "display": "inline-block",
  "minHeight": "1.2em",
  "minWidth": "0.05em",
  "verticalAlign": "top",
  "flexShrink": 0,
  "::selection": {
    background: "transparent",
  },
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

export const listItem = recipe({
  base: {
    display: "list-item",
    marginBlock: "0.25em",
  },
  variants: {
    listType: {
      ul: {
        listStyleType: "disc",
      },
      ol: {
        listStyleType: "decimal",
      },
    },
    first: {
      true: {
        marginTop: "1em",
      },
    },
    last: {
      true: {
        marginBottom: "1em",
      },
    },
  },
})
