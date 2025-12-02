import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

export const styledLogo = style({
  display: "flex",
  padding: 8,
  flexDirection: "row",
  whiteSpace: "nowrap",
  marginLeft: -2,
  marginRight: 32,
  lineHeight: "16px",
})

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

export const headerLinksContainer = recipe({
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  variants: {
    onMobile: {
      true: {
        position: "absolute",
        top: "var(--header-height)",
        right: 0,
        left: 0,
        height: "100vh",
        paddingTop: 24,
        paddingRight: 28,
        boxSizing: "border-box",
        flexDirection: "column",
        background: "white",
        alignItems: "flex-end",
      },
    },
  },
})
