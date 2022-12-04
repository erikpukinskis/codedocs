import { styled } from "@stitches/react"
import { Link } from "react-router-dom"

export const NavList = styled("ul", {
  marginTop: 12,
  marginLeft: 12,
  marginBottom: 12,
})

export const NavHeading = styled("span", {
  lineHeight: "24px",
  fontWeight: 600,
  color: "#b4b4b4",
})

export const NavLink = styled(Link, {
  display: "block",
  lineHeight: "24px",
})

export const NavItem = styled("li", {
  padding: "none",
  margin: "none",
  marginLeft: "0 !important",
  whiteSpace: "nowrap",
  color: "#444",
  listStyleType: "none",
})
