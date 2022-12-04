import { styled } from "@stitches/react"

export const Button = styled("button", {
  "background": "white",
  "padding": "8px 24px",
  "border": "1px solid black",
  "borderRadius": 5,
  "fontSize": "1em",

  "&:hover": {
    boxShadow: `0px 2px 0px 1px #CCC`,
    cursor: "pointer",
  },
})
