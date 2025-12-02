import { style, globalStyle } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

export const emptyState = style({
  width: "14em",
  fontSize: "0.8em",
  color: "#888",
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 16,
  paddingRight: 16,
})

export const searchResult = recipe({
  base: {
    "width": "14em",
    "display": "block",
    "color": "inherit",
    "paddingTop": 8,
    "paddingBottom": 8,
    "paddingLeft": 16,
    "paddingRight": 16,

    ":hover": {
      background: "#eee",
    },
  },
  variants: {
    isHighlighted: {
      true: {
        background: "#eee",
      },
    },
  },
})

export const resultSnippet = style({
  fontSize: "0.8em",
  color: "#888",
  maxHeight: "2.6em",
  overflow: "hidden",
})

globalStyle(`${resultSnippet} mark`, {
  background: "#eeffc6",
  color: "#3a7174",
  fontWeight: "bold",
})

export const resultTitle = style({})

globalStyle(`${resultTitle} mark`, {
  background: "#eeffc6",
  color: "#3a7174",
  fontWeight: "bold",
})
