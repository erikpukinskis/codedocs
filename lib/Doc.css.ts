import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

export const tabBar = style({
  display: "flex",
  gap: 8,
  borderBottom: "1px solid #e0e0e0",
})

export const tab = recipe({
  base: {
    "background": "none",
    "border": "none",
    "padding": "4px 10px",
    "fontSize": "0.85em",
    "cursor": "pointer",
    "color": "#666",
    "borderBottom": "2px solid transparent",
    "marginBottom": -1,

    ":hover": {
      color: "#333",
    },
  },
  variants: {
    active: {
      true: {
        color: "#333",
        fontWeight: 600,
        borderBottom: "2px solid #5f577d",
      },
    },
  },
})

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

export const codeBlock = style({
  fontFamily: "monospace",
  whiteSpace: "pre",
  backgroundColor: "#f5f5f5",
  padding: "12px 0",
  borderRadius: 4,
  counterReset: "line-number",
})

export const codeLine = style({
  display: "grid",
  gridTemplateColumns: "2.5em 1fr",
  counterIncrement: "line-number",

  "::before": {
    content: "counter(line-number)",
    textAlign: "right",
    paddingRight: "1em",
    color: "#999",
    userSelect: "none",
  },
})
