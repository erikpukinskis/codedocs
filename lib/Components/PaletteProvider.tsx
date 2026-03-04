import { configure } from "@dnd-kit/abstract"
import { Cursor, Feedback } from "@dnd-kit/dom"
import {
  useDraggable,
  useDroppable,
  useDragDropMonitor,
  DragDropProvider,
  useDragOperation,
} from "@dnd-kit/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useState } from "react"
import { Button } from "./Button"
import * as styles from "./Palette.css"
import type {
  AllowedPropTypes,
  ComponentDef,
  PropsLookup,
} from "~/helpers/componentTypes"
import { getDraggingComponentTransform } from "~/helpers/getDraggingComponentTransform"

type PaletteProviderProps<Lookup extends PropsLookup> = {
  children: React.ReactNode
  palette: {
    [key in keyof Lookup]: ComponentDef<Lookup[key]>
  }
}

export function PaletteProvider<ComponentDefs extends PropsLookup>({
  children,
  palette,
}: PaletteProviderProps<ComponentDefs>) {
  return (
    <DragDropProvider
      plugins={(defaults) => [
        ...defaults,
        configure(Cursor, { cursor: "default" }),
        configure(Feedback, { dropAnimation: null }),
      ]}
      onDragEnd={(event) => {
        if (event.canceled) return

        // We dropped outside of a slot
        if (!event.operation.target) return

        if (!event.operation.source) {
          throw new Error("Received drag operation with no source?")
        }

        // const componentName = event.operation.source.id
        // const slotId = event.operation.target.id
      }}
    >
      <PaletteProviderInner palette={palette}>{children}</PaletteProviderInner>
    </DragDropProvider>
  )
}

type PointerOperation = {
  activatorEvent: PointerEvent
  source: { element: Element; id: string }
}

function isPointerOperation(operation: {
  activatorEvent: Event | null
  source: unknown
}): operation is PointerOperation {
  if (!(operation.activatorEvent instanceof PointerEvent)) return false
  const source = operation.source as PointerOperation["source"]
  if (typeof source.id !== "string") return false
  return source.element instanceof Element
}

function PaletteProviderInner<ComponentDefs extends PropsLookup>({
  children,
  palette,
}: PaletteProviderProps<ComponentDefs>) {
  const [isOpen, setOpen] = useState(true)

  useDragDropMonitor({
    onDragStart: (event) => {
      if (!isPointerOperation(event.operation)) return

      const { tx, ty } = getDraggingComponentTransform(
        event.operation.source.element.getBoundingClientRect(),
        event.operation.activatorEvent
      )

      document.documentElement.style.setProperty("--drag-tx", `${tx}px`)
      document.documentElement.style.setProperty("--drag-ty", `${ty}px`)
    },
  })

  return (
    <>
      {children}
      <div className={styles.componentsTrigger}>
        <Button onClick={() => setOpen(true)}>Show Components</Button>
      </div>

      <div className={styles.paletteContainer({ isOpen })}>
        <button className={styles.closeButton} onClick={() => setOpen(false)}>
          <FontAwesomeIcon icon="xmark" />
        </button>
        {Object.keys(palette).map((key) => (
          <ComponentSource key={key} name={key} componentDef={palette[key]} />
        ))}
      </div>
    </>
  )
}

type ComponentSourceProps<PropsType extends Record<string, AllowedPropTypes>> =
  { name: string; componentDef: ComponentDef<PropsType> }

function ComponentSource<PropsType extends Record<string, AllowedPropTypes>>({
  name,
  componentDef: { component: Component, props: propDefLookup },
}: ComponentSourceProps<PropsType>) {
  const { ref } = useDraggable({
    id: name,
    feedback: "clone",
  })

  const defaultProps = Object.entries(propDefLookup).reduce(
    (acc, [key, propDef]) => ({
      ...acc,
      [key]: propDef.default,
    }),
    {} as PropsType
  )

  return (
    <div ref={ref} className={styles.draggableComponent}>
      <div className={styles.componentWrapper}>
        <Component {...defaultProps} />
      </div>
    </div>
  )
}

export function useDroppableSlot(id: string) {
  const { ref, isDropTarget } = useDroppable({
    id,
  })

  const { source } = useDragOperation()
  const isDragging = source !== null

  return { isDragging, isDropTarget, ref }
}
