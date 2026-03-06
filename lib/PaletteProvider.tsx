import { configure } from "@dnd-kit/abstract"
import { Cursor, Feedback } from "@dnd-kit/dom"
import {
  useDraggable,
  useDragDropMonitor,
  DragDropProvider,
} from "@dnd-kit/react"
import React, { createContext, useContext } from "react"
import * as styles from "./Palette.css"
import { Panel } from "./Panel"
import type {
  AllowedPropTypes,
  SlotDefLookup,
  PropDefLookup,
  PropsLookup,
  SlotDef,
} from "~/helpers/componentTypes"
import { getDraggingComponentTransform } from "~/helpers/getDraggingComponentTransform"
import { makeUninitializedContext } from "~/helpers/makeUninitializedContext"

export function useComponentPalette() {
  const { palette } = useContext(PaletteContext)

  return palette
}
type PaletteContextValue = {
  palette: SlotDefLookup
}

const PaletteContext = createContext(
  makeUninitializedContext<PaletteContextValue>(
    "Cannot use PaletteContext outside of a PaletteProvider"
  )
)

type PaletteProviderProps<Lookup extends PropsLookup> = {
  children: React.ReactNode
  palette: {
    [key in keyof Lookup]: SlotDef<Lookup[key]>
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
    >
      <PaletteContext
        value={{
          palette: palette as SlotDefLookup, // Casting since React contexts can't be generic
        }}
      >
        {children}
        <Palette palette={palette} />
      </PaletteContext>
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

type PaletteProps<Lookup extends PropsLookup> = {
  palette: {
    [key in keyof Lookup]: SlotDef<Lookup[key]>
  }
}

function Palette<ComponentDefs extends PropsLookup>({
  palette,
}: PaletteProps<ComponentDefs>) {
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
    <Panel panel="left" title="Components">
      <div className={styles.componentGroup}>
        {Object.keys(palette).map((key) => (
          <ComponentSource key={key} name={key} slotDef={palette[key]} />
        ))}
      </div>
    </Panel>
  )
}

type ComponentSourceProps<PropsType extends Record<string, AllowedPropTypes>> =
  { name: string; slotDef: SlotDef<PropsType> }

function ComponentSource<PropsType extends Record<string, AllowedPropTypes>>({
  name,
  slotDef: { component: Component, props: propDefLookup },
}: ComponentSourceProps<PropsType>) {
  const { ref } = useDraggable({
    id: name,
    feedback: "clone",
  })

  return (
    <div ref={ref} className={styles.draggableComponent}>
      <div className={styles.componentWrapper}>
        <Component {...getPropValues(propDefLookup)} />
      </div>
    </div>
  )
}

export function getPropValues<
  PropsType extends Record<string, AllowedPropTypes>
>(propDefLookup: PropDefLookup<PropsType>) {
  return Object.entries(propDefLookup).reduce(
    (acc, [key, propDef]) => ({
      ...acc,
      [key]: propDef.value,
    }),
    {} as PropsType
  )
}
