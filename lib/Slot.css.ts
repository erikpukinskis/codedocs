import { recipe } from "@vanilla-extract/recipes"

export const slot = recipe({
  base: {
    minWidth: 18,
    minHeight: 18,
    border: "2px dashed #ccc",
    // background: "#bdc0ff4f",
    // borderColor: "#bdc0ff4f",
    borderRadius: 4,
    display: "inline-block",
  },
  variants: {
    isDropTarget: {
      true: {},
    },
    isDragging: {
      true: {},
    },
  },
  compoundVariants: [
    {
      variants: {
        isDropTarget: false,
        isDragging: true,
      },
      style: {
        background: "#bdc0ff4f",
        borderColor: "#bdc0ff4f",
      },
    },
    {
      variants: {
        isDropTarget: true,
        isDragging: true,
      },
      style: {
        background: "#889cff73",
        borderColor: "#889cff",
      },
    },
  ],
})
