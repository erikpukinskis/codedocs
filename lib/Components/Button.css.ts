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
