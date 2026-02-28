import { style } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

export const paletteContainer = recipe({
  base: {
    position: "fixed",
    top: "var(--header-height)",
    left: 0,
    width: 160,
    bottom: 0,
    background: "white",
    borderRight: "1px solid #ddd",
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  variants: {
    isOpen: {
      false: {
        display: "none",
      },
    },
  },
})

export const closeButton = style({
  position: "absolute",
  top: 0,
  right: 0,
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 8,
})

export const componentsTrigger = style({
  position: "fixed",
  bottom: 10,
  left: 10,
})

export const componentWrapper = style({
  pointerEvents: "none",
})

export const slot = style({
  minWidth: 18,
  minHeight: 18,
  border: "1.8px dashed #ddd",
  borderRadius: 4,
  display: "inline-block",
})
