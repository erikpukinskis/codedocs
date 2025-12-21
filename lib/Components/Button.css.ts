import { recipe } from "@vanilla-extract/recipes"

export const headerLink = recipe({
  base: {
    lineHeight: "16px",
    padding: 8,
  },
  variants: {
    isCurrent: {
      true: { color: "black" },
    },
  },
})

export const styledButton = recipe({
  base: {
    "background": "#b7c2ff",
    "color": "#43386e",
    "padding": "4px 6px",
    "border": "1px solid transparent",
    "borderRadius": 5,
    "fontSize": "0.8em",
    "cursor": "pointer",

    ":hover": {
      color: "#2d1e68",
    },
  },
  variants: {
    secondary: {
      true: {
        "background": "transparent",
        "borderColor": "#bfaeff",
        "color": "#bfaeff",

        ":hover": {
          color: "#d3caff",
          borderColor: "#d3caff",
        },
      },
    },
  },
  defaultVariants: {
    secondary: false,
  },
})
