import {
  useDragDropMonitor,
  useDragOperation,
  useDroppable,
} from "@dnd-kit/react"
import { useSlot } from "./Mockup"
import * as styles from "./Palette.css"
import { getDefaultProps, useComponentPalette } from "./PaletteProvider"

type EmptySlotProps = {
  id: string
}

export const EmptySlot: React.FC<EmptySlotProps> = ({ id }) => {
  const { ref, isDropTarget, isDragging } = useDroppableSlot(id)

  return (
    <div
      ref={ref}
      data-slot-id={id}
      className={styles.slot({ isDropTarget, isDragging })}
    />
  )
}

export function useDroppableSlot(id: string) {
  const { ref, isDropTarget } = useDroppable({
    id,
  })
  const componentPalette = useComponentPalette()

  const [_, setSlotDef] = useSlot(id)

  useDragDropMonitor({
    onDragEnd(event) {
      if (event.canceled) return

      // We dropped outside of any slot
      if (!event.operation.target) return

      // We dropped it on a different slot
      if (event.operation.target.id !== id) return

      if (!event.operation.source) {
        throw new Error("Received drag operation with no source?")
      }

      const componentDef = componentPalette[event.operation.source.id]

      if (!componentDef) {
        throw new Error(
          `Component ${event.operation.source.id} not found in palette`
        )
      }

      setSlotDef({
        id,
        component: componentDef.component,
        props: getDefaultProps(componentDef.props) as Record<
          string,
          React.ReactNode
        >,
      })
    },
  })

  const { source } = useDragOperation()
  const isDragging = source !== null

  return { isDragging, isDropTarget, ref }
}
