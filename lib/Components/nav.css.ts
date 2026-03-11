import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

export const navList = style({
  marginTop: 12,
  marginLeft: 12,
  marginBottom: 12,
})

export const navHeading = style({
  lineHeight: "24px",
  fontWeight: 600,
  color: "#99b",
})

export const navLink = recipe({
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    lineHeight: "20px",
    padding: 8,
    marginLeft: -8,
    borderRadius: 4,
  },
  variants: {
    current: {
      true: {
        color: "#8a8aca",
        pointerEvents: "none",
      },
    },
  },
})

export const navItem = style({
  padding: 0,
  margin: 0,
  marginLeft: "0 !important",
  color: "#444",
  listStyleType: "none",
})
