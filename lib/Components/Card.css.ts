import { recipe } from "@vanilla-extract/recipes"

export const card = recipe({
  base: {
    borderRadius: 4,
    border: "1px solid #ddd",
    background: "white",
    boxShadow: "0px 2px 3px 0px rgba(0, 0, 0, 0.05)",
  },
  variants: {
    pad: {
      "default": {
        padding: 16,
      },
      "top-and-bottom": {
        paddingTop: 8,
        paddingBottom: 8,
      },
    },
  },
  defaultVariants: {
    pad: "default",
  },
})
