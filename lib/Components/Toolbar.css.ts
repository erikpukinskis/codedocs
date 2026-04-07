import { style } from "@vanilla-extract/css"

export const toolbar = style({
  vars: {
    "--buffer-width": "8px",
  },
})

export const toolbarBuffer = style({
  borderRadius: "var(--buffer-width)",
  userSelect: "none",
  padding: "var(--buffer-width)",
  marginBottom: "calc(var(--buffer-width) * -1)",
  vars: {
    "--buffer-width": "8px",
  },
})

export const toolbarConent = style({
  background: "#444",
  color: "white",
  padding: "4px 6px",
  borderRadius: 5,
  // marginBottom: "calc(var(--buffer-width) * -1)",
})
