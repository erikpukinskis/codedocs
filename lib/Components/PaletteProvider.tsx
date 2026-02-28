import {
  DragOverlay,
  useDraggable,
  useDroppable,
  useDragDropMonitor,
  DragDropProvider,
} from "@dnd-kit/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useState } from "react"
import { Button } from "./Button"
import * as styles from "./Palette.css"
import type {
  AllowedPropTypes,
  ComponentDef,
  ComponentDefLookup,
} from "~/helpers/componentTypes"

type PaletteProviderProps<ComponentDefs extends ComponentDefLookup> = {
  children: React.ReactNode
  palette: {
    [key in keyof ComponentDefs]: ComponentDef<ComponentDefs[key]>
  }
}

// const foo: ComponentDef<{ foo: string }> = {
//   component: ({ foo }) => <div>{foo}</div>,
//   props: {
//     foo: { type: "string", default: "foo" },
//   },
// }

// console.log(foo)

export function PaletteProvider<ComponentDefs extends ComponentDefLookup>({
  children,
  palette,
}: PaletteProviderProps<ComponentDefs>) {
  return (
    <DragDropProvider>
      <PaletteProviderInner palette={palette}>{children}</PaletteProviderInner>
    </DragDropProvider>
  )
}

function PaletteProviderInner<ComponentDefs extends ComponentDefLookup>({
  children,
  palette,
}: PaletteProviderProps<ComponentDefs>) {
  const [isOpen, setOpen] = useState(true)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  useDragDropMonitor({
    onDragStart: (event) => {
      const id = event.operation.source?.id as string | undefined
      setActiveKey(id?.replace("component-", "") ?? null)
    },
    onDragEnd: () => {
      setActiveKey(null)
    },
  })

  const activeComponentDef = activeKey ? palette[activeKey] : null

  return (
    <>
      {children}
      <DragOverlay>
        {activeComponentDef && (
          <div style={{ transform: "scale(0.5)", transformOrigin: "top left" }}>
            <OverlayComponent componentDef={activeComponentDef} />
          </div>
        )}
      </DragOverlay>
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
    id: `component-${name}`,
    feedback: "clone",
  })

  const defaultProps = Object.entries(propDefLookup).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value.default,
    }),
    {} as PropsType
  )

  return (
    <div ref={ref}>
      <div className={styles.componentWrapper}>
        <Component {...defaultProps} />
      </div>
    </div>
  )
}

function OverlayComponent<PropsType extends Record<string, AllowedPropTypes>>({
  componentDef: { component: Component, props: propDefLookup },
}: {
  componentDef: ComponentDef<PropsType>
}) {
  const defaultProps = Object.entries(propDefLookup).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value.default }),
    {} as PropsType
  )
  return (
    <div className={styles.componentWrapper}>
      <Component {...defaultProps} />
    </div>
  )
}

type CanvasProps = {}

export const Canvas: React.FC<CanvasProps> = ({}) => {
  const { ref } = useDroppable({
    id: "canvas",
  })

  return <div ref={ref} className={styles.slot}></div>
}
