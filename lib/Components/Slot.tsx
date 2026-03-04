import {
  useDragDropMonitor,
  useDragOperation,
  useDroppable,
} from "@dnd-kit/react"
import React from "react"
import { useSlot } from "./Mockup"
import * as styles from "./Palette.css"
import { useComponentPalette } from "./PaletteProvider"
import { isEmptySlot, isSlotId } from "~/helpers/componentTypes"

type SlotProps = { id: string }

let counter = 0
/**
 * Recursively renders a SlotDef tree. Memoized so that unchanged subtrees
 * (identified by reference equality on `slotDef`) skip re-rendering. This is
 * the key to the performance model — Immer's structural sharing ensures
 * unchanged branches keep their references, and memo bails them out.
 */
export const Slot = React.memo(function Slot({ id }: SlotProps) {
  counter++

  const { source } = useDragOperation()
  const isDragging = source !== null

  if (counter > 100) {
    throw new Error("Too many slots")
  }

  const [slotDef] = useSlot(id)

  const Component = slotDef.component
  const renderedProps: Record<string, unknown> = {}

  for (const [key, propDef] of Object.entries(slotDef.props)) {
    if (isSlotId(propDef.value)) {
      renderedProps[key] = <Slot id={propDef.value.__slotId} />
    } else if (isDragging && isEmptySlot(slotDef, key)) {
      renderedProps[key] = <EmptySlot id="??" />
    } else {
      renderedProps[key] = propDef.value
    }
  }

  return <Component data-slot-id={id} {...renderedProps} />
})

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
        props: componentDef.props,
      })
    },
  })

  const { source } = useDragOperation()
  const isDragging = source !== null

  return { isDragging, isDropTarget, ref }
}
