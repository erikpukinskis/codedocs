import { style } from "@vanilla-extract/css"

/** Establishes the containing block for the absolutely positioned toolbar. */
export const toolbarPositionRoot = style({
  position: "relative",
})

export const toolbar = style({
  position: "absolute",
  display: "block",
  zIndex: 1,
  vars: {
    "--buffer-width": "8px",
  },
})

export const toolbarBuffer = style({
  display: "block",
  borderRadius: "var(--buffer-width)",
  userSelect: "none",
  padding: "var(--buffer-width)",
  marginBlock: "calc(var(--buffer-width) * -1)",
})

export const toolbarConent = style({
  display: "block",
  background: "#444",
  color: "white",
  padding: 6,
  borderRadius: 7,
  // marginBottom: "calc(var(--buffer-width) * -1)",
})
