import { styled } from "@stitches/react"
import { type CardProps } from "@/ComponentTypes"
import type React from "react"

export const Card = styled("div", {
  borderRadius: 4,
  border: "1px solid #DDD",
  background: "white",

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
}) as React.FC<CardProps>
