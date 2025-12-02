import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

export const cropMark = style({
  background: "rgba(0,0,0,0.25)",
  width: 1,
  height: 1,
  position: "absolute",
})

export const demoWithCode = style({})

export const demoContainer = recipe({
  base: {
    position: "relative",
    marginBottom: "calc(0.8em + 12px)",
  },
  variants: {
    inline: {
      true: {
        display: "inline-block",
      },
      false: {
        width: "100%",
      },
    },
  },
})

export const tabs = style({
  position: "absolute",
  right: 0,
  top: "100%",
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: 10,
  paddingBlock: 6,
  paddingInline: 4,
})
