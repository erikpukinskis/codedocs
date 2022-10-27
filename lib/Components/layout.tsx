import { styled } from "@stitches/react"

export const Columns = styled("div", {
  display: "flex",
  flexDirection: "row",
  minHeight: "100%",
})

export const LeftColumn = styled("nav", {
  borderRight: "1px solid #EEE",
  minWidth: "128px",
  flexShrink: 0,
  padding: "20px",
})

export const MainColumn = styled("div", { padding: "20px", maxWidth: "40em" })
