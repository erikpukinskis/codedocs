import { recipe } from "@vanilla-extract/recipes"

export const button = recipe({
  base: {
    background: "#b7c2ff",
    border: "1px solid transparent",
    borderRadius: 5,
    fontSize: "0.8em",
    padding: "4px 6px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  variants: {
    variant: {
      default: {
        "color": "#43386e",
        ":hover": {
          color: "#2d1e68",
        },
      },
      transparent: {
        "background": "transparent",
        "borderColor": "#bfaeff",
        "color": "#bfaeff",

        ":hover": {
          color: "#d3caff",
          borderColor: "#d3caff",
        },
      },
      borderless: {
        "background": "transparent",
        "color": "white",
        ":hover": {
          background: "rgba(255, 255, 255, 0.1)",
          color: "#cdcdff",
        },
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
})
