import { style } from "@vanilla-extract/css"

export const styledButton = style({
  "background": "white",
  "padding": "8px 24px",
  "border": "1px solid black",
  "borderRadius": 5,
  "fontSize": "1em",

  ":hover": {
    boxShadow: "0px 2px 0px 1px rgba(0, 0, 0, 0.2)",
    cursor: "pointer",
  },
})
