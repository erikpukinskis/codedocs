import { recipe } from "@vanilla-extract/recipes"

export const styledButton = recipe({
  base: {
    "background": "#b7c2ff",
    "border": "1px solid transparent",
    "borderRadius": 5,
    "fontSize": "0.8em",
    "cursor": "pointer",
    "display": "inline-flex",
    "alignItems": "center",
    "gap": 4,

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
    inline: {
      true: {
        "background": "transparent",
        "color": "white",
        ":hover": {
          color: "#e9c6ff",
          textShadow: "0 0 5px #fab6ff88",
        },
      },
      false: {
        padding: "4px 6px",
        color: "#43386e",
      },
    },
  },
  defaultVariants: {
    secondary: false,
    inline: false,
  },
})
