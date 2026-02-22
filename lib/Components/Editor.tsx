import { produce } from "immer"
import React, { memo, useRef, useState } from "react"

export type SlotDef = {
  /**
   * The component's props type should be the same as the props type, but I
   * don't know that we can enforce that without making a pretty gnarly generic.
   * If we want to punt on that, we can just cast the Component and props to the
   * right state. If we do that, let's keep the component props type as unknown
   * so we have to be explicit when we do that cast.
   */
  component: React.FC<unknown>
  /**
   * We may need to expand this props type union in the future, but for now strings
   * and booleans are enough.
   */
  props: Record<string, string | boolean | number | SlotDef>
}

type SlotPath = string[]

const SlotRenderer = memo(
  // TODO: Split out SlotRendererProps type
  ({ slotDef, path }: { slotDef: SlotDef; path: SlotPath }) => {
    const Component = slotDef.component
    const renderedProps: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(slotDef.props)) {
      if (isSlotDef(value)) {
        renderedProps[key] = (
          <SlotRenderer slotDef={value} path={[...path, key]} />
        )
      } else {
        renderedProps[key] = value
      }
    }

    // TODO: Do we need the full path here? Or could we just use the key and somehow scope to the right slot by using bubbling?
    return <Component data-slot-path={path.join(".")} {...renderedProps} />
  }
)

SlotRenderer.displayName = "SlotRenderer"

function isSlotDef(value: unknown): value is SlotDef {
  return (
    typeof value === "object" &&
    value !== null &&
    "component" in value &&
    "props" in value
  )
}

type EditorProps = {
  root: SlotDef
}

export function Editor({ root: initialRoot }: EditorProps) {
  const [slotTree, setSlotTree] = useState(initialRoot)

  /**
   * Editor-specific:
   */
  const [inputStyle, setInputStyle] = useState<
    React.CSSProperties | undefined
  >()
  const [editingProp, setEditingProp] = useState<string | undefined>()
  const [currentSlotPath, setCurrentSlotPath] = useState<SlotPath | undefined>()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)

  /** And specific to the hovered one */
  const [hoveredProp, setHoveredProp] = useState<string | undefined>()
  const hoveredElementRef = useRef<HTMLElement | null>()

  const updateSlotProp = (path: SlotPath, propName: string, value: unknown) => {
    // TODO: Why not get tree from renderer slope?
    setSlotTree((tree) =>
      produce(tree, (draft) => {
        let current: SlotDef = draft
        for (const key of path) {
          const nextValue = current.props[key]
          if (!isSlotDef(nextValue)) {
            throw new Error(`Expected SlotDef at path ${path.join(".")}`)
          }
          current = nextValue
        }
        current.props[propName] = value as string | boolean | number | SlotDef
      })
    )
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
    setEditingProp(hoveredProp)
    setHoveredProp(undefined)

    inputRef.current?.focus()

    const target = hoveredElementRef.current
    if (!target) {
      throw new Error("Focused textarea but no element was hovered?")
    }

    syncEditorWithTarget(target)
  }

  const handleClickCapture = (event: React.MouseEvent) => {
    event.stopPropagation()

    if (!(event.target instanceof HTMLElement)) return

    const { prop, slotPath } = findPropForElementText(event.target, slotTree)

    setEditingProp(prop)
    // TODO: I think we actually need two textareas. One for the thing being
    // hovered and one for the thing being edited. Otherwise it's awkward to try
    // to click out of one element into another.
    setCurrentSlotPath(slotPath)
    syncEditorWithTarget(event.target)
  }

  const handleMouseOverCapture = (event: React.MouseEvent) => {
    if (editingProp) return

    const { target, currentTarget: editorElement } = event

    if (!(target instanceof HTMLElement)) return
    if (!(editorElement instanceof HTMLElement)) return

    const { prop, slotPath } = findPropForElementText(target, slotTree)

    if (!prop) return

    hoveredElementRef.current = target
    syncStyles(target, editorElement)
    setHoveredProp(prop)
    setCurrentSlotPath(slotPath)
  }

  const handleMouseOutCapture = (event: React.MouseEvent) => {
    if (editingProp) return
    if (!(event.target instanceof HTMLElement)) return

    // If we're mousing out of the element onto another random element, we clear
    // the state. But if we're mousing onto the textarea, don't do anything:
    if (event.relatedTarget === inputRef.current) {
      return
    }

    setInputStyle(undefined)
    setCurrentSlotPath(undefined)
  }

  const finishEditing = () => {
    observerRef.current?.disconnect()
    observerRef.current = null
    setInputStyle(undefined)
    setEditingProp(undefined)
    setCurrentSlotPath(undefined)
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
    if (!currentSlotPath) return
    const prop = editingProp ?? hoveredProp
    if (!prop) return

    let current: SlotDef = slotTree
    for (const key of currentSlotPath) {
      const nextValue = current.props[key]
      if (!isSlotDef(nextValue)) {
        throw new Error(`Expected SlotDef at path ${currentSlotPath.join(".")}`)
      }
      current = nextValue
    }
    return current.props[prop] as string
  }

  const handleValueChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingProp) {
      throw new Error("Editing but there's no prop?")
    }

    if (!currentSlotPath) {
      throw new Error("Editing but there's no slot?")
    }

    updateSlotProp(
      currentSlotPath,
      editingProp,
      event.target.value.replace(/ +$/, "\u00A0")
    )
  }

  return (
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
        <SlotRenderer slotDef={slotTree} path={[]} />
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
  )
}

/**
 * Figures out which slot and which prop corresponds to the text in an element. For example, if
 *
 * 1) The DOM looks like this:
 *
 *  ```
 *      <button data-slot-path="tag">
 *        <svg />
 *        <span>Save</span>
 *      </button>
 *  ```
 *
 * 2) The slot rendered:
 *
 * ```
 *      <Button label="Save" icon="disk" />
 * ```
 *
 * 3) You pass in the `<span>` element (because it was the click target)
 *
 * Then this function will return `{ prop: "label", slotPath: ["tag"] }`
 */
function findPropForElementText(
  element: HTMLElement,
  slotTree: SlotDef
): { prop?: string; slotPath?: SlotPath } {
  const slotElement = element.closest("[data-slot-path]")

  if (!slotElement) return {}

  const pathString = slotElement.getAttribute("data-slot-path") ?? undefined

  if (!pathString) return {}

  const slotPath = pathString === "" ? [] : pathString.split(".")

  // Navigate to the slot in the tree
  let current: SlotDef = slotTree
  for (const key of slotPath) {
    const value = current.props[key]
    if (!isSlotDef(value)) return {}
    current = value
  }

  const text = getTextContent(element)

  if (!text) return {}

  for (const prop in current.props) {
    const value = current.props[prop]
    if (typeof value !== "string") continue
    if (value !== text) continue
    return { prop, slotPath }
  }

  return {}
}

function getTextContent(element: HTMLElement) {
  for (let i = 0; i < element.childNodes.length; i++) {
    const { nodeType, textContent } = element.childNodes[i]
    if (nodeType !== Node.TEXT_NODE) continue
    return textContent ?? undefined
  }
}
