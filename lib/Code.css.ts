import { style } from "@vanilla-extract/css"

export const codeContainer = style({
  borderRadius: 6,
  background: "#0c0529",
  opacity: "90%",
  maxWidth: "45em",
  paddingBottom: 4,
})

export const codeInnerContainer = style({
  borderRadius: 6,
  background: "#282A36",
  padding: 6,
  position: "relative",
})

export const copyButtonContainer = style({
  position: "absolute",
  zIndex: 1,
  right: 8,
  bottom: 8,
})
