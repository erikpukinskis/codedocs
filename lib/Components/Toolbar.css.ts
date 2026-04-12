import { style } from "@vanilla-extract/css"

/**
 * We calculate the position of Toolbar targets relative to this outlet, which
 * is a stable document-locked reference point. And then because the toolbar is
 * always inside the outlet, and the outlet is position: relative then we can
 * position the toolbar relative to any DOMRect or HTMLElement.
 */
export const toolbarOutlet = style({
  position: "relative",
  border: "1px solid red",
})

export const toolbar = style({
  position: "absolute",
  display: "block",
  zIndex: 1,
  vars: {
    "--buffer-width": "8px",
  },
})

export const toolbarBuffer = style({
  display: "block",
  borderRadius: "var(--buffer-width)",
  userSelect: "none",
  padding: "var(--buffer-width)",
  marginBlock: "calc(var(--buffer-width) * -1)",
})

export const toolbarConent = style({
  display: "block",
  background: "#444",
  color: "white",
  padding: 6,
  borderRadius: 7,
  // marginBottom: "calc(var(--buffer-width) * -1)",
})
