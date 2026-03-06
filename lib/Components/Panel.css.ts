import { recipe } from "@vanilla-extract/recipes"

export const Panel = recipe({
  base: {
    borderTop: "none",
    borderRight: "none",
    borderLeft: "none",
    padding: 16,
  },
  variants: {
    hasNeighbors: {
      true: {
        borderBottom: "1px solid #ddd",
      },
    },
  },
})

export const PanelHeader = recipe({
  base: {
    background: "none",
    fontSize: "0.9em",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    margin: -16,
    color: "#99b",
  },
  variants: {
    isOpen: {
      true: {
        cursor: "default",
      },
      false: {
        cursor: "pointer",
      },
    },
  },
})
