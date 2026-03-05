import { style, globalStyle } from "@vanilla-extract/css"
import { recipe } from "@vanilla-extract/recipes"

export const paletteContainer = recipe({
  base: {
    position: "fixed",
    top: "var(--header-height)",
    left: 0,
    width: "10em",
    boxSizing: "border-box",
    bottom: 0,
    background: "white",
    borderRight: "1px solid #ddd",
    padding: 8,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
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

export const draggableComponent = style({
  // display: "inline-flex",
})

globalStyle("[data-dnd-dragging]", {
  // --drag-tx and --drag-ty are calculated in getDraggingComponentTransform.
  transform: "scale(0.5) translateX(var(--drag-tx)) translateY(var(--drag-ty))",
  transformOrigin: "center",
})
