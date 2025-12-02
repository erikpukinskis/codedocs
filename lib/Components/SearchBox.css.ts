import { style, globalStyle } from "@vanilla-extract/css"

export const clearButtonTarget = style({
  background: "#aaa",
  width: 20,
  height: 20,
  lineHeight: "21px",
  overflow: "hidden",
  textAlign: "center",
  borderRadius: 9999,
  color: "white",
  fontSize: "1.2em",
  cursor: "pointer",

  ":hover": {
    background: "#bbb",
  },

  ":active": {
    background: "#999",
  },
})

export const styledClearButton = style({
  position: "absolute",
  lineHeight: "16px",
  padding: 8,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  height: "100%",
  right: 0,
  top: 0,
  border: "none",
  background: "none",
})

export const styledSearchBox = style({
  position: "relative",
  width: "14em",
})

export const styledKeys = style({
  position: "absolute",
  top: 0,
  right: 6,
  marginRight: "0.3em",
  height: "100%",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
  color: "#888",
  fontSize: "0.6em",
})

export const styledKey = style({
  borderRadius: 6,
  padding: "0.5em",
  minWidth: "1.5em",
  textAlign: "center",
  border: "1px solid #ccc",
  lineHeight: "1em",
})

export const styledSearchInput = style({
  padding: 8,
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 6,
  border: "1px solid #ccc",
})

// Hide the keys when the input is focused or has a value
globalStyle(`${styledSearchInput}:focus + .${styledKeys}`, {
  display: "none",
})

globalStyle(`${styledSearchInput}:not(:placeholder-shown) + .${styledKeys}`, {
  display: "none",
})

