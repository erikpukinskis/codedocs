import { style } from "@vanilla-extract/css"

export const footerContainer = style({
  paddingTop: 256,
  paddingBottom: 64,
  bottom: 0,
  opacity: 0.7,
})

export const swatches = style({
  display: "flex",
  flexDirection: "row",
  gap: 16,
})

export const swatch = style({
  borderRadius: 3,
  width: 16,
  height: 16,
})

export const copyright = style({
  marginTop: 16,
  color: "#b5aaa0",
})

