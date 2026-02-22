import { produce } from "immer"
import React, { useCallback, useRef, useState } from "react"

/**
 * Describes a node in the slot tree. The Editor receives a single root SlotDef.
 *
 * The tree is stored in React state and updated via Immer's `produce`, which
 * provides structural sharing: when a leaf prop changes, only the ancestor
 * chain gets new object references. Combined with React.memo on SlotRenderer,
 * this means only the changed branch re-renders — siblings are unaffected.
 */
export type SlotDef = {
  /**
   * The component's props type should be the same as the props type, but we
   * can't enforce that without a pretty gnarly generic. The component prop type
   * is `unknown` so call sites must cast explicitly.
   */
  component: React.FC<unknown>
  /**
   * Primitive props are passed through directly. Object-valued props are
   * assumed to be nested SlotDefs and rendered recursively via SlotRenderer.
   * If we ever need literal object props, we'll need a wrapper (e.g. a Slot
   * class) to disambiguate.
   */
  props: Record<string, string | boolean | number | SlotDef>
}

/**
 * Dot-separated keys representing the path from the root SlotDef to a
 * particular slot. E.g. ["tag"] means root.props.tag, and ["sidebar", "header"]
 * means root.props.sidebar.props.header.
 */
type SlotPath = string[]

type SlotRendererProps = { slotDef: SlotDef; path: SlotPath }

/**
 * Recursively renders a SlotDef tree. Memoized so that unchanged subtrees
 * (identified by reference equality on `slotDef`) skip re-rendering. This is
 * the key to the performance model — Immer's structural sharing ensures
 * unchanged branches keep their references, and memo bails them out.
 */
const SlotRenderer = React.memo(({ slotDef, path }: SlotRendererProps) => {
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

  return <Component data-slot-path={path.join(".")} {...renderedProps} />
})

SlotRenderer.displayName = "SlotRenderer"

function isSlotDef(value: unknown): value is SlotDef {
  return (
    typeof value === "object" &&
    value !== null &&
    "component" in value &&
    "props" in value
  )
}

/**
 * State for a single editable textarea overlay. The Editor maintains two of
 * these (indexed 1 and 2, using 1-based indexing so we can use falsiness
 * checks on the index). One is for the element being edited, the other for
 * the element being hovered. This allows both textareas to exist simultaneously
 * so a user can be editing one prop while hovering another, and click directly
 * into the hovered textarea without a remount.
 */
type EditableState = {
  /**
   * The prop name within the slot being edited, e.g. "children" or "label"
   */
  prop: string
  /**
   * E.g. ["sidebar", "header"] means the slot is at root.props.sidebar.props.header
   */
  slotPath: SlotPath
  /**
   * Positioning and typography styles for the textarea overlay. These are
   * synced with the element being edited, so that the textarea lines up exactly
   * with it. This allows the textarea have a transparent background making it
   * look like you're just editing the element directly.
   *
   * NOTE: This kind of works OK, but is brittle, and we may eventually want to
   * just make the textarea more like a popover with an opaque background. In
   * particular, we know this setup will not work for ellipsized text.
   */
  inputStyle: React.CSSProperties
  /**
   * The element whose text content is being "edited"
   */
  targetElement: HTMLElement
  /**
   * The corresponding textarea element. Null initially because the editable is created
   * in state before the textarea mounts — populated via callback ref on the
   * next render.
   */
  textAreaElement: HTMLTextAreaElement | null
  /**
   * Watches the target element for size changes so the textarea can reposition.
   * Only active when the editable is in editing mode (undefined in hovered mode).
   */
  observer?: ResizeObserver
}

type Editables = [never, EditableState | undefined, EditableState | undefined]

type EditorProps = {
  root: SlotDef
}

export function Editor({ root: initialRoot }: EditorProps) {
  const [slotTree, setSlotTree] = useState(initialRoot)

  const [editables, setEditables] = useState<Editables>([
    undefined as never,
    undefined,
    undefined,
  ])
  const [editing, setEditing] = useState<1 | 2 | undefined>()
  const [hovered, setHovered] = useState<1 | 2 | undefined>()

  const editorRef = useRef<HTMLDivElement | null>(null)

  const updateSlotProp = (path: SlotPath, propName: string, value: unknown) => {
    setSlotTree(
      produce(slotTree, (draft) => {
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

  const calculateInputStyle = (
    target: HTMLElement,
    editorElement: HTMLElement
  ): React.CSSProperties => {
    const rect = target.getBoundingClientRect()
    const editorRect = editorElement.getBoundingClientRect()
    const style = window.getComputedStyle(target)

    return {
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
    }
  }

  /**
   * Sets or clears the editable at the given index. Pass `undefined` to clear,
   * which also disconnects any active ResizeObserver.
   */
  const setEditable = (index: 1 | 2, editable: EditableState | undefined) => {
    editables[index]?.observer?.disconnect()
    const next: Editables = [...editables]
    next[index] = editable
    setEditables(next)
  }

  const startObserving = (index: 1 | 2) => {
    const editable = editables[index]
    if (!editable) {
      throw new Error(
        `Why are we trying to observe editable ${index} before it exists?`
      )
    }

    const editorElement = editorRef.current
    if (!editorElement) {
      throw new Error("Cannot observe before editor ref is available")
    }

    // Recalculate textarea positioning whenever the target element resizes
    // (e.g. content changes from editing could cause reflows)
    const observer = new ResizeObserver(() => {
      const inputStyle = calculateInputStyle(
        editable.targetElement,
        editorElement
      )
      setEditables((prev) => {
        const next: Editables = [...prev]
        const current = next[index]
        if (current) {
          next[index] = { ...current, inputStyle, observer }
        }
        return next
      })
    })

    observer.observe(editable.targetElement)

    setEditables((prev) => {
      const next: Editables = [...prev]
      const current = next[index]
      if (current) {
        next[index] = { ...current, observer }
      }
      return next
    })
  }

  const handleClickCapture = (event: React.MouseEvent) => {
    event.stopPropagation()

    if (!(event.target instanceof HTMLElement)) return

    const editorElement = editorRef.current
    if (!editorElement) return

    const { prop, slotPath } = findPropForElementText(event.target, slotTree)

    // findPropForElementText returns empty when: the element has no slot
    // ancestor, the element has no direct text node, or text was found but no
    // prop matches it (e.g. the component transforms the prop before rendering).
    if (!prop || !slotPath) return

    if (editing) {
      // Use the other slot for the new edit location
      const newEditingIndex: 1 | 2 = editing === 1 ? 2 : 1
      setEditable(newEditingIndex, {
        prop,
        slotPath,
        inputStyle: calculateInputStyle(event.target, editorElement),
        targetElement: event.target,
        textAreaElement: null,
      })
      setEditing(newEditingIndex)
      startObserving(newEditingIndex)
    } else if (hovered) {
      // Transition hovered to editing
      setEditing(hovered)
      startObserving(hovered)
    } else {
      // Start fresh at slot 1
      setEditable(1, {
        prop,
        slotPath,
        inputStyle: calculateInputStyle(event.target, editorElement),
        targetElement: event.target,
        textAreaElement: null,
      })
      setEditing(1)
      startObserving(1)
    }
  }

  const handleMouseOverCapture = (event: React.MouseEvent) => {
    const { target, currentTarget: editorElement } = event

    if (!(target instanceof HTMLElement)) return
    if (!(editorElement instanceof HTMLElement)) return

    const { prop, slotPath } = findPropForElementText(target, slotTree)
    if (!prop || !slotPath) return

    // Determine which slot to use for hover
    // If editing is in slot 1, use slot 2 for hover (and vice versa)
    const hoverIndex: 1 | 2 = editing === 1 ? 2 : 1

    setEditable(hoverIndex, {
      prop,
      slotPath,
      inputStyle: calculateInputStyle(target, editorElement),
      targetElement: target,
      textAreaElement: null,
    })
    setHovered(hoverIndex)
  }

  const handleMouseOutCapture = (event: React.MouseEvent) => {
    if (!(event.target instanceof HTMLElement)) return

    // Don't clear hover if we're mousing onto either textarea — the user may
    // be moving their cursor to click into it
    if (
      event.relatedTarget === editables[1]?.textAreaElement ||
      event.relatedTarget === editables[2]?.textAreaElement
    ) {
      return
    }

    if (hovered) {
      setEditable(hovered, undefined)
      setHovered(undefined)
    }
  }

  const handleTextareaFocus = (index: 1 | 2) => {
    // When focusing a textarea, it becomes the editing one
    setEditing(index)
    if (hovered === index) {
      setHovered(undefined)
    }
    startObserving(index)
  }

  const handleTextareaBlur = (index: 1 | 2) => {
    // When blurring, clear editing state
    if (editing === index) {
      setEditable(index, undefined)
      setEditing(undefined)
    }
  }

  /**
   * Stable callback refs for each textarea. Must be stable (useCallback with
   * empty deps) because React calls the old ref with null and the new ref with
   * the element whenever the ref function identity changes — an unstable ref
   * would write null back into state, trigger a re-render, and loop forever.
   */
  const handleTextareaRef1 = useCallback((el: HTMLTextAreaElement | null) => {
    setEditables((prev) => {
      const current = prev[1]
      if (!current || current.textAreaElement === el) return prev
      const next: Editables = [...prev]
      next[1] = { ...current, textAreaElement: el }
      return next
    })
  }, [])

  const handleTextareaRef2 = useCallback((el: HTMLTextAreaElement | null) => {
    setEditables((prev) => {
      const current = prev[2]
      if (!current || current.textAreaElement === el) return prev
      const next: Editables = [...prev]
      next[2] = { ...current, textAreaElement: el }
      return next
    })
  }, [])

  const getCurrentValue = (index: 1 | 2) => {
    const editable = editables[index]
    if (!editable) return ""

    let current: SlotDef = slotTree
    for (const key of editable.slotPath) {
      const nextValue = current.props[key]
      if (!isSlotDef(nextValue)) {
        throw new Error(
          `Expected SlotDef at path ${editable.slotPath.join(".")}`
        )
      }
      current = nextValue
    }
    return current.props[editable.prop] as string
  }

  const handleValueChange =
    (index: 1 | 2) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const editable = editables[index]
      if (!editable) {
        throw new Error(`Value changed but editable ${index} doesn't exist?`)
      }

      updateSlotProp(
        editable.slotPath,
        editable.prop,
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
      {editables[1] && (
        // TODO: Make this a component that takes in the editable state and renders the textarea.
        <textarea
          ref={handleTextareaRef1}
          value={getCurrentValue(1)}
          onFocus={() => handleTextareaFocus(1)}
          onChange={handleValueChange(1)}
          onBlur={() => handleTextareaBlur(1)}
          onMouseOut={handleMouseOutCapture}
          // TODO: Replace all of these inline styles with vanilla extract.
          style={{
            position: "absolute",
            zIndex: 1,
            background: "transparent",
            border: "none",
            outline: editing === 1 ? undefined : "1px solid gray",
            boxSizing: "border-box",
            resize: "none",
            ...editables[1].inputStyle,
          }}
        />
      )}
      {editables[2] && (
        <textarea
          ref={handleTextareaRef2}
          value={getCurrentValue(2)}
          onFocus={() => handleTextareaFocus(2)}
          onChange={handleValueChange(2)}
          onBlur={() => handleTextareaBlur(2)}
          onMouseOut={handleMouseOutCapture}
          style={{
            position: "absolute",
            zIndex: 1,
            background: "transparent",
            border: "none",
            outline: editing === 2 ? undefined : "1px solid gray",
            boxSizing: "border-box",
            resize: "none",
            ...editables[2].inputStyle,
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

  if (pathString === undefined) return {}

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

/**
 * Returns the first text node's content within an element, ignoring non-text
 * children. Used to match DOM text back to slot props for editing.
 *
 * NOTE: This is obviously somewhat brittle. It only works for components that
 * pass through text content, unchanged, to a single element. Long term, we may
 * need to make this more explicit (at least optionally) by putting a
 * data-prop-name attribute onto elements to connect them back to a specific
 * prop. But that requires fairly invasive component changes. Would be good to
 * avoid those, or at least keep them optional.
 */
function getTextContent(element: HTMLElement) {
  for (let i = 0; i < element.childNodes.length; i++) {
    const { nodeType, textContent } = element.childNodes[i]
    if (nodeType !== Node.TEXT_NODE) continue
    return textContent ?? undefined
  }
}
