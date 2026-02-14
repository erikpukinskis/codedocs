import { style } from "@vanilla-extract/css"

export const layoutContainer = style({
  vars: {
    "--header-height": "84px",
  },
})

export const columns = style({
  display: "flex",
  flexDirection: "row",
  minHeight: "100vh",
  position: "absolute",
  top: 0,
  left: 0,
  width: "100vw",
  maxWidth: "100vw",
})

export const logoIcon = style({
  border: "2px solid black",
  borderRadius: 6,
  padding: 4,
  margin: -6,
  marginRight: 8,
})

export const fixedTopHeader = style({
  position: "fixed",
  height: "var(--header-height)",
  background: "white",
  top: 0,
  left: 0,
  width: "100vw",
  borderBottom: "1px solid #ddd",
  boxSizing: "border-box",
  paddingLeft: 32,
  paddingRight: 32,
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0px 0px 3px 0px rgba(0, 0, 0, 0.05)",
  zIndex: 2,
})

export const leftColumn = style({
  marginTop: "var(--header-height)",
  borderRight: "1px solid #eee",
  boxSizing: "border-box",
  minWidth: "10em",
  maxWidth: "10em",
  paddingLeft: 32,
  paddingTop: 32,
  paddingRight: 8,
})

export const mainColumn = style({
  marginTop: "var(--header-height)",
  padding: 32,
  paddingBottom: 256,
  boxSizing: "border-box",
  width: "40em",
  maxWidth: "min(40em, calc(100vw - 10em))",
  position: "relative",
})

export const centerColumn = style({
  marginTop: "var(--header-height)",
  marginLeft: 0,
  paddingBottom: 256,
  minHeight: "100vh",
  position: "relative",
  padding: 32,
})
