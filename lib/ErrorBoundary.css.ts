import { style } from "@vanilla-extract/css"

export const demoErrorContainer = style({
  background: "#ff6690",
  fontSize: "0.8em",
  color: "white",
  paddingInline: 14,
  paddingBlock: 10,
  borderRadius: 8,
  boxShadow: "0px 2px 10px 0px inset #dd4295",
  borderBottom: "1px solid #ffaad6",
  margin: "-8px",
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
