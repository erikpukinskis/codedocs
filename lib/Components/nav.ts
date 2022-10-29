import { styled } from "@stitches/react"
import { Link } from "react-router-dom"

export const NavList = styled("ul", {
  marginTop: 12,
  marginLeft: 12,
  marginBottom: 12,
})

export const NavHeading = styled("span", { fontWeight: 600, padding: "10px 0" })

export const NavLink = styled(Link, { color: "#444" })

export const NavItem = styled("li", {
  padding: "none",
  margin: "none",
  whiteSpace: "nowrap",
  color: "#444",
  listStyleType: "none",
})
