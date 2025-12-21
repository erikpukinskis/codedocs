import { style } from "@vanilla-extract/css"

export const demoErrorContainer = style({
  position: "relative",
  background: "#ff6666",
  fontSize: "0.85em",
  color: "white",
  paddingInline: 14,
  paddingBlock: 10,
  borderRadius: 8,
  boxShadow: "0px 2px 10px 0px inset #f53da7",
  borderBottom: "1px solid #ffc3c3",
})

export const demoErrorHeading = style({
  margin: 0,
  fontWeight: "600",
  marginBottom: "0.25em",
  color: "white",
})

export const demoErrorDetails = style({
  margin: 0,
  color: "white",
})
