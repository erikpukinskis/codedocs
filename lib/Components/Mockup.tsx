import { keyBy } from "lodash"
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react"
import * as styles from "./Palette.css"
import { useDroppableSlot } from "./PaletteProvider"
import { isSlotId, type SlotDef } from "~/helpers/componentTypes"
import { makeUninitializedContext } from "~/helpers/makeUninitializedContext"

type MockupContextValue = {
  slotsById: Record<string, SlotDef>
}

export function useSlot(id: string) {
  const { slotsById } = useContext(MockupContext)

  const slot = slotsById[id]

  if (!slot) {
    throw new Error(`Slot ${id} not found`)
  }

  return slot
}

const MockupContext = createContext(
  makeUninitializedContext<MockupContextValue>(
    "Cannot use MockupContext outside of a MockupProvider"
  )
)

type MockupProviderProps = {
  children: React.ReactNode
  slots: SlotDef[]
}

export const MockupProvider: React.FC<MockupProviderProps> = ({
  children,
  slots,
}) => {
  const [slotsById, setSlotsById] = useState<Record<string, SlotDef>>(() =>
    keyBy(slots, "id")
  )

  const [editables, setEditables] = useState<Editables>([
    undefined as never,
    undefined,
    undefined,
  ])
  const [editing, setEditing] = useState<1 | 2 | undefined>()
  const [hovered, setHovered] = useState<1 | 2 | undefined>()

  const editorRef = useRef<HTMLDivElement | null>(null)

  const updateSlotProp = (slotId: string, propName: string, value: unknown) => {
    setSlotsById((prev) => {
      const next = { ...prev }
      next[slotId] = { ...next[slotId], [propName]: value }
      return next
    })
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

    const { prop, slotId } = findPropForElementText(event.target, slotsById)

    // findPropForElementText returns empty when: the element has no slot
    // ancestor, the element has no direct text node, or text was found but no
    // prop matches it (e.g. the component transforms the prop before rendering).
    if (!prop || !slotId) return

    if (editing) {
      // Use the other slot for the new edit location
      const newEditingIndex: 1 | 2 = editing === 1 ? 2 : 1
      setEditable(newEditingIndex, {
        prop,
        slotId: slotId,
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
        slotId,
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

    const { prop, slotId } = findPropForElementText(target, slotsById)
    if (!prop || !slotId) return

    // Determine which slot to use for hover
    // If editing is in slot 1, use slot 2 for hover (and vice versa)
    const hoverIndex: 1 | 2 = editing === 1 ? 2 : 1

    setEditable(hoverIndex, {
      prop,
      slotId,
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

    const slotDef = slotsById[editable.slotId]
    if (!slotDef) {
      throw new Error(`Slot with id ${editable.slotId} not found?`)
    }

    const value = slotDef.props[editable.prop]

    if (typeof value !== "string") {
      throw new Error(
        `Expected string value for prop ${editable.prop} in slot ${
          editable.slotId
        } but got ${typeof value}`
      )
    }

    return value
  }

  const handleValueChange =
    (index: 1 | 2) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const editable = editables[index]
      if (!editable) {
        throw new Error(`Value changed but editable ${index} doesn't exist?`)
      }

      updateSlotProp(
        editable.slotId,
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
        <MockupContext value={{ slotsById }}>{children}</MockupContext>
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

type SlotProps = { id: string }

let counter = 0
/**
 * Recursively renders a SlotDef tree. Memoized so that unchanged subtrees
 * (identified by reference equality on `slotDef`) skip re-rendering. This is
 * the key to the performance model — Immer's structural sharing ensures
 * unchanged branches keep their references, and memo bails them out.
 */
export const Slot = React.memo(({ id }: SlotProps) => {
  counter++

  if (counter > 100) {
    throw new Error("Too many slots")
  }

  const slotDef = useSlot(id)

  const Component = slotDef.component
  const renderedProps: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(slotDef.props)) {
    if (isSlotId(value)) {
      renderedProps[key] = <Slot id={value.__slotId} />
    } else {
      renderedProps[key] = value
    }
  }

  return <Component data-slot-id={id} {...renderedProps} />
})

Slot.displayName = "SlotRenderer"

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
  slotId: string
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

/**
 * Figures out which slot and which prop corresponds to the text in an element. For example, if
 *
 * 1) The DOM looks like this:
 *
 *  ```
 *      <button data-slot-id="abc123">
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
 * Then this function will return `{ prop: "label", slotId: "abc123" }`
 */
function findPropForElementText(
  element: HTMLElement,
  slotsById: Record<string, SlotDef>
): { prop?: string; slotId?: string } {
  // TODO: Reimplement this using the flat slotsById structure
  const slotElement = element.closest("[data-slot-id]")

  if (!slotElement) return {}

  const slotId = slotElement.getAttribute("data-slot-id") ?? undefined

  if (slotId === undefined) {
    throw new Error(
      "Found the closest slot element with a data-slot-id but then it was undefined?"
    )
  }

  const text = getTextContent(element)

  if (!text) return {}

  const slotDef = slotsById[slotId]

  if (!slotDef) {
    throw new Error(`Slot with id ${slotId} not found?`)
  }

  for (const prop in slotDef.props) {
    const value = slotDef.props[prop]
    if (typeof value !== "string") continue
    if (value !== text) continue
    return { prop, slotId }
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
