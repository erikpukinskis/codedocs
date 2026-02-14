import { style } from "@vanilla-extract/css"

export const navList = style({
  marginTop: 12,
  marginLeft: 12,
  marginBottom: 12,
})

export const navHeading = style({
  lineHeight: "24px",
  fontWeight: 600,
  color: "#b4b4b4",
})

export const navLink = style({
  display: "block",
  lineHeight: "20px",
})

export const navItem = style({
  padding: "none",
  margin: "none",
  marginLeft: "0 !important",
  color: "#444",
  listStyleType: "none",
})
