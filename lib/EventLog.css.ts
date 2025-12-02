import { style, keyframes } from "@vanilla-extract/css"

export const fadeOut = keyframes({
  "0%": {
    opacity: 1,
  },
  "100%": {
    display: "none",
  },
})

export const eventLogBase = style({
  position: "absolute",
  padding: 0,
  zIndex: 1,
  margin: 0,
})

export const eventItemBase = style({
  fontSize: "0.8em",
  listStyle: "none",
  marginTop: 8,
  marginLeft: 0,
  marginRight: 0,
  marginBottom: 0,
  background: "#c1ffc5",
  padding: "4px 6px",
  borderRadius: 4,
  boxSizing: "border-box",
  animation: `${fadeOut} 1s linear 2s forwards`,
  boxShadow: "0px 0px 8px 0px rgba(47, 255, 0, 0.3)",
})

export const eventName = style({
  fontWeight: "bold",
  background: "white",
  padding: "2px 4px",
  borderRadius: 4,
  display: "inline-block",
})

export const arg = style({
  background: "white",
  padding: "2px 4px",
  borderRadius: 4,
  display: "inline-block",
  color: "#00631f",
  marginLeft: 4,
})

