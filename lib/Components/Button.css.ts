import { style } from "@vanilla-extract/css"

export const styledButton = style({
  "background": "white",
  "padding": "4px 6px",
  "border": "none",
  "borderRadius": 5,
  "fontSize": "0.8em",
  "cursor": "pointer",

  ":hover": {
    color: "#333",
  },
})

export const linkButton = style({
  "background": "none",
  "padding": 0,
  "border": "none",
  "display": "inline",
  "fontSize": "0.8em",
  "cursor": "pointer",
  "color": "#444",
  "textShadow": "0.3px 0 0 currentColor",

  ":hover": {
    color: "#000",
  },
})
