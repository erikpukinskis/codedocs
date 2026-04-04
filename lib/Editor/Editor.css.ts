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

export const codeBlock = style({
  fontFamily: "monospace",
  whiteSpace: "pre",
  backgroundColor: "#f5f5f5",
  padding: "12px 0",
  borderRadius: 4,
  counterReset: "line-number",
})

export const codeLine = style({
  "display": "grid",
  "gridTemplateColumns": "2.5em 1fr",
  "counterIncrement": "line-number",

  "::before": {
    content: "counter(line-number)",
    textAlign: "right",
    paddingRight: "1em",
    color: "#999",
    userSelect: "none",
  },
})
