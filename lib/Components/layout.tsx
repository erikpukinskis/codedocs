import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { styled } from "@stitches/react"

export const LayoutContainer = styled("div", {
  "--header-height": "84px",
})

export const Columns = styled("div", {
  display: "flex",
  flexDirection: "row",
  minHeight: "100vh",
  position: "absolute",
  overflow: "scroll-y",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
})

export const LogoIcon = styled(FontAwesomeIcon, {
  border: "2px solid black",
  borderRadius: 6,
  padding: 4,
  margin: -6,
  marginRight: 8,
})

export const FixedTopHeader = styled("div", {
  position: "fixed",
  height: "var(--header-height)",
  background: "white",
  top: 0,
  left: 0,
  width: "100vw",
  borderBottom: "1px solid #DDD",
  boxSizing: "border-box",
  paddingLeft: 32,
  paddingRight: 32,
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0px 0px 3px 0px rgba(0,0,0,0.05)",
  zIndex: 2,
})

export const LeftColumn = styled("nav", {
  marginTop: "var(--header-height)",
  borderRight: "1px solid #EEE",
  minWidth: "128px",
  paddingLeft: 32,
  paddingTop: 32,
  paddingRight: 8,
})

export const MainColumn = styled("div", {
  marginTop: "var(--header-height)",
  padding: 32,
  paddingBottom: 256,
  width: "90%",
  minHeight: "calc(100% - var(--header-height))",
  position: "relative",
})

export const CenterColumn = styled(MainColumn, {
  marginTop: "var(--header-height)",
  marginLeft: 0,
  paddingBottom: 256,
  minHeight: "100vh",
  position: "relative",
})
