import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

export { outdentIcon } from "./Demo.css"

export const Component = recipe({
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "row",
    gap: 16,
    paddingInline: 14,
    paddingBlock: 10,
    borderRadius: 8,
    background: "#eee",
    marginBlock: "1em",
    boxSizing: "border-box",
  },
  variants: {
    skip: {
      true: {
        background: "#ffbc2c",
        fontSize: "0.85em",
        color: "white",
        paddingInline: 14,
        paddingBlock: 10,
        borderRadius: 8,
        boxShadow: "0px 2px 10px 0px inset #ffa33c",
        borderBottom: "1px solid #ffd79d",
      },
      false: {
        color: "#7d81b8",
        boxShadow: "0px 2px 10px 0px inset #e1dbf3",
        borderBottom: "1px solid #ededf4",
        background: "#eee",
      },
    },
  },
})

export const PropsPanel = style({
  alignSelf: "flex-start",
  width: 180,
  flexShrink: 0,
  flexGrow: 0,
  display: "flex",
  flexDirection: "column",
  gap: 4,
})

export const PropLabel = style({
  fontWeight: "500",
  display: "block",
})

export const PropInput = style({
  paddingInline: 8,
  paddingBlock: 4,
  borderRadius: 4,
  border: "1px solid #ccc",
  color: "#667",
  width: "100%",
  boxSizing: "border-box",
})

export const DemoContainer = style({
  alignSelf: "middle",
  flexGrow: 1,
  flexShrink: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
})

export const PropDescription = style({
  color: "#667",
  paddingLeft: 1,
  fontSize: "0.8em",
  lineHeight: "1.2em",
  fontStyle: "italic",
})
