import { styled } from "@stitches/react"
import { type CardProps } from "@/ComponentTypes"

export const Card: React.FC<CardProps> = styled("div", {
  borderRadius: 4,
  border: "1px solid #DDD",
  background: "white",

  variants: {
    padding: {
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
    padding: "default",
  },
})
