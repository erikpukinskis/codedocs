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
