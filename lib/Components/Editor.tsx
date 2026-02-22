import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

type SlotsContextValue = {
  getSlotProps: (id: string) => Record<string, unknown> | undefined
  setSlotProps: (id: string, props: Record<string, unknown>) => void
  registerSlot: (id: string, initialProps: Record<string, unknown>) => void
  unregisterSlot: (id: string) => void
}

const SlotsContext = createContext<SlotsContextValue | null>(null)

function useSlot<PropsType extends Record<string, unknown>>({
  originalProps,
}: {
  originalProps: PropsType
}) {
  const [id] = useState(() => Math.random().toString(36).slice(2, 9))
  const context = useContext(SlotsContext)

  if (!context) {
    throw new Error("useSlot must be used within a SlotsContext provider")
  }

  // Register on mount, unregister on unmount
  useEffect(() => {
    context.registerSlot(id, originalProps)
    return () => {
      context.unregisterSlot(id)
    }
  }, []) // eslint-disable-line

  const props = context.getSlotProps(id) as PropsType | undefined

  return { id, props: props ?? originalProps }
}

type SlotProps<PropsType extends Record<string, unknown>> = {
  component: React.FC<PropsType>
  props: PropsType
}

export function Slot<PropsType extends Record<string, unknown>>({
  component: Component,
  props: originalProps,
}: SlotProps<PropsType>) {
  const { id: slotId, props } = useSlot({ originalProps })

  return <Component data-slot-id={slotId} {...props} />
}

type EditorProps = {
  children: React.ReactNode
}

export function Editor({ children }: EditorProps) {
  const [slotPropsById, setSlotPropsById] = useState(
    () => new Map<string, Record<string, unknown>>()
  )

  const [inputStyle, setInputStyle] = useState<
    React.CSSProperties | undefined
  >()
  const [editingProp, setEditingProp] = useState<string | undefined>()
  const [hoveredProp, setHoveredProp] = useState<string | undefined>()
  const [currentSlotId, setCurrentSlotId] = useState<string | undefined>()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>()
  const editorRef = useRef<HTMLDivElement | null>(null)

  const registerSlot = (id: string, initialProps: Record<string, unknown>) => {
    setSlotPropsById((prev) => {
      const next = new Map(prev)
      next.set(id, initialProps)
      return next
    })
  }

  const unregisterSlot = (id: string) => {
    setSlotPropsById((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }

  const getSlotProps = (id: string) => {
    return slotPropsById.get(id)
  }

  const setSlotProps = (id: string, props: Record<string, unknown>) => {
    setSlotPropsById((prev) => {
      const next = new Map(prev)
      next.set(id, props)
      return next
    })
  }

  const findPropForElementText = (
    element: HTMLElement,
    slotPropsById: Map<string, Record<string, unknown>>
  ): { prop?: string; slotId?: string } => {
    const slotElement = element.closest("[data-slot-id]")

    if (!slotElement) return {}

    const slotId = slotElement.getAttribute("data-slot-id") ?? undefined

    if (!slotId) return {}

    const props = slotPropsById.get(slotId)

    if (!props) return {}

    let text: string | undefined
    for (let i = 0; i < element.childNodes.length; i++) {
      const { nodeType, textContent } = element.childNodes[i]
      if (nodeType !== Node.TEXT_NODE) continue
      text = textContent ?? undefined
      break
    }

    if (!text) return {}

    for (const prop in props) {
      const value = props[prop]
      if (typeof value !== "string") continue
      if (value !== text) continue
      return { prop, slotId }
    }

    return {}
  }

  const syncEditorWithTarget = (target: HTMLElement) => {
    const editorElement = editorRef.current
    if (!editorElement) {
      throw new Error("Focused textarea but editor ref never appeared?")
    }

    observerRef.current = new ResizeObserver(() => {
      syncStyles(target, editorElement)
    })
    observerRef.current.observe(target)
  }

  const handleTextareaFocus = () => {
    console.debug("FOCUS")

    setEditingProp(hoveredProp)
    setHoveredProp(undefined)

    inputRef.current?.focus()

    const target = hoveredElementRef.current
    if (!target) {
      throw new Error("Focused textarea but no element was hovered?")
    }

    syncEditorWithTarget(target)
  }

  console.debug({ hoveredProp, editingProp })

  const handleClickCapture = (event: React.MouseEvent) => {
    console.debug("CLICK CAPTURE")
    event.stopPropagation()

    if (!(event.target instanceof HTMLElement)) return

    const { prop, slotId } = findPropForElementText(event.target, slotPropsById)

    setEditingProp(prop)
    // TODO: I think we actually need two textareas. One for the thing being
    // hovered and one for the thing being edited. Otherwise it's awkward to try
    // to click out of one element into another.
    setCurrentSlotId(slotId)
    syncEditorWithTarget(event.target)
  }

  const handleMouseOverCapture = (event: React.MouseEvent) => {
    if (editingProp) return

    const { target, currentTarget: editorElement } = event

    if (!(target instanceof HTMLElement)) return
    if (!(editorElement instanceof HTMLElement)) return

    const { prop, slotId } = findPropForElementText(target, slotPropsById)

    if (!prop) return

    console.debug("over", slotId, prop)

    hoveredElementRef.current = target
    syncStyles(target, editorElement)
    setHoveredProp(prop)
    setCurrentSlotId(slotId)
  }

  const handleMouseOutCapture = (event: React.MouseEvent) => {
    if (editingProp) return
    if (!(event.target instanceof HTMLElement)) return

    // If we're mousing out of the element onto another random element, we clear
    // the state. But if we're mousing onto the textarea, don't do anything:
    if (event.relatedTarget === inputRef.current) {
      console.debug("headed for textarea, not clearing")
      return
    }

    setInputStyle(undefined)
    setCurrentSlotId(undefined)
  }

  const finishEditing = () => {
    observerRef.current?.disconnect()
    observerRef.current = null
    setInputStyle(undefined)
    setEditingProp(undefined)
    setCurrentSlotId(undefined)
  }

  const syncStyles = (target: HTMLElement, editorElement: HTMLElement) => {
    const rect = target.getBoundingClientRect()
    const editorRect = editorElement.getBoundingClientRect()
    const style = window.getComputedStyle(target)

    setInputStyle({
      top: rect.top - editorRect.top,
      left: rect.left - editorRect.left,
      width: rect.width,
      height: rect.height,
      padding: style.padding,
      boxSizing: "border-box",
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      color: style.color,
      outline: "1px solid gray",
    })
  }

  // Get the current value for the editing prop
  const getCurrentValue = () => {
    if (!currentSlotId) return
    const slotProps = slotPropsById.get(currentSlotId)
    if (!slotProps) return
    const prop = editingProp ?? hoveredProp
    if (!prop) return
    return slotProps[prop] as string
  }

  const handleValueChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.debug("CHANGE")
    if (!editingProp) {
      throw new Error("Editing but there's no prop?")
    }

    if (!currentSlotId) {
      throw new Error("Editing but there's no slot?")
    }

    const slotProps = slotPropsById.get(currentSlotId)

    if (!slotProps) {
      throw new Error("Editing but can't find slot props?")
    }

    setSlotProps(currentSlotId, {
      ...slotProps,
      [editingProp]: event.target.value.replace(/ +$/, "\u00A0"),
    })
  }

  return (
    <SlotsContext.Provider
      value={{ getSlotProps, setSlotProps, registerSlot, unregisterSlot }}
    >
      <div style={{ position: "relative" }}>
        {/* <style>{`[data-component="Editor"] * { cursor: ${
          cursor ?? "default"
        } !important; }`}</style> */}
        <div
          data-component="Editor"
          ref={editorRef}
          onClickCapture={handleClickCapture}
          onMouseOverCapture={handleMouseOverCapture}
          onMouseOutCapture={handleMouseOutCapture}
          style={{ isolation: "isolate", zIndex: 0 }}
        >
          {children}
        </div>
        {inputStyle && (
          <textarea
            value={getCurrentValue()}
            onFocus={handleTextareaFocus}
            onChange={handleValueChange}
            onBlur={finishEditing}
            onMouseOut={handleMouseOutCapture}
            ref={inputRef}
            style={{
              position: "absolute",
              zIndex: 1,
              background: "transparent",
              border: "none",
              outline: editingProp ? undefined : "1px solid gray",
              boxSizing: "border-box",
              resize: "none",
              ...inputStyle,
            }}
          />
        )}
      </div>
    </SlotsContext.Provider>
  )
}
