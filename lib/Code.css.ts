import { style } from "@vanilla-extract/css"

export const codeContainer = style({
  borderRadius: 6,
  background: "#15006e",
  opacity: "90%",
  paddingBottom: 3,
})

export const codeInnerContainer = style({
  borderRadius: 6,
  background: "#4d446e",
  padding: 6,
  position: "relative",
})

export const copyButtonContainer = style({
  position: "absolute",
  zIndex: 1,
  right: 8,
  bottom: 8,
})
