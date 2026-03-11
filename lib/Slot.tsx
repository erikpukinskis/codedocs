import {
  useDragDropMonitor,
  useDragOperation,
  useDroppable,
} from "@dnd-kit/react"
import React, { useState } from "react"
import { generate } from "short-uuid"
import { useSetProp, useSetRootSlotId, useSlot } from "./Mockup"
import { useComponentPalette } from "./PaletteProvider"
import * as styles from "./Slot.css"
import { isEmptySlot, isSlotId, slotId } from "~/helpers/componentTypes"

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

  useComponentPalette()

  const { source } = useDragOperation()
  const isDragging = source !== null

  if (counter > 100) {
    throw new Error("Too many slot renders")
  }

  const [slotDef] = useSlot(id)

  if (!slotDef) {
    throw new Error(`Cannot use Slot to render empty slots`)
  }

  const Component = slotDef.component
  const renderedProps: Record<string, unknown> = {}

  for (const [propName, propDef] of Object.entries(slotDef.props)) {
    if (isSlotId(propDef.value)) {
      renderedProps[propName] = <Slot id={propDef.value.__slotId} />
    } else if (isDragging && isEmptySlot(slotDef, propName)) {
      renderedProps[propName] = (
        <EmptySlot location={{ parentSlotId: id, propName }} />
      )
    } else {
      renderedProps[propName] = propDef.value
    }
  }

  return <Component data-slot-id={id} {...renderedProps} />
})

type EmptySlotProps = {
  location: { parentSlotId: string; propName: string } | "root"
}

export const EmptySlot: React.FC<EmptySlotProps> = ({ location }) => {
  const { ref, isDropTarget, isDragging, id } = useDroppableSlot({ location })

  return (
    <div
      ref={ref}
      data-slot-id={id}
      className={styles.slot({ isDropTarget, isDragging })}
    />
  )
}

type UseDroppableSlotArgs = {
  location: { parentSlotId: string; propName: string } | "root"
}

export function useDroppableSlot({ location }: UseDroppableSlotArgs) {
  const [id] = useState(generate)
  const setRootSlot = useSetRootSlotId()
  const setProp = useSetProp()
  const componentPalette = useComponentPalette()

  const { ref, isDropTarget } = useDroppable({
    id,
  })

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

      if (location === "root") {
        setRootSlot(id)
      } else {
        setProp({
          slotId: location.parentSlotId,
          propName: location.propName,
          value: slotId(id),
        })
      }

      // We also need to take this id and set it as either the root slot id in
      // the mockup, or stick it into the correct prop of the parent.
    },
  })

  const { source } = useDragOperation()
  const isDragging = source !== null

  return { isDragging, isDropTarget, ref, id }
}
