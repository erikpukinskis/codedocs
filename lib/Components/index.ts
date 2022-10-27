import { Link as _Link } from "react-router-dom"
import { styled } from "@stitches/react"

export * from "./Search"
export * from "./GlobalStyles"
export * from "./Popover"
export * from "./Header"
export * from "./Card"
export * from "./SearchBox"
export * from "./nav"
export * from "./Social"
export * from "./layout"

export const Link = _Link

export const PageHeading = styled("h1", { fontSize: 36, paddingBottom: "10px" })

export const DemoHeading = styled("h2", {
  fontWeight: 600,
  paddingTop: "40px",
  paddingBottom: "10px",
})
