import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useState,
} from "react"
import * as styles from "./Toolbar.css"
import { useElementObserver } from "~/hooks/useElementObserver"

type PositionRelativeRect = {
  left: number
  top: number
  width: number
  height: number
}

function getPositionRelativeToRoot(
  root: HTMLElement,
  rect: Pick<DOMRectReadOnly, "left" | "top" | "width" | "height">
): PositionRelativeRect {
  const o = root.getBoundingClientRect()
  return {
    left: rect.left - o.left,
    top: rect.top - o.top,
    width: rect.width,
    height: rect.height,
  }
}

type ToolbarProps = {
  content: React.ReactNode
  /** Toolbar root element; use to treat pointer hits on the toolbar like “still hovering” the editor target. */
  rootRef?: React.Ref<HTMLDivElement | null>
  listenerAreaRef: React.RefObject<HTMLElement | null>
  /**
   * Either an HTMLElement if we have one (e.g. for a LinkElement) or a DOMRect
   * if there's not an element to position relative to. For example, when we
   * position a toolbar near the active selection, we'll use:
   *
   *       target={ReactEditor.toDOMRange(editor, activeRange).getClientRects()[0]}
   */
  target?: Element | DOMRectReadOnly | null
  open?: boolean
}

function assignRef<T>(ref: React.Ref<T | null> | undefined, value: T | null) {
  if (!ref) return
  if (typeof ref === "function") ref(value)
  else ref.current = value
}

export const Toolbar: React.FC<ToolbarProps> = ({
  content,
  rootRef,
  listenerAreaRef,
  target,
  open,
}): React.ReactNode => {
  const {
    ref: observerRef,
    element: toolbar,
    hasFocus,
    isHovered,
  } = useElementObserver()

  const setRoot = useCallback(
    (el: HTMLDivElement | null) => {
      observerRef(el)
      assignRef(rootRef, el)
    },
    [observerRef, rootRef]
  )
  const [didWait, setDidWait] = useState(false)
  const [, bumpAfterLayout] = useReducer((n: number) => n + 1, 0)

  // Internal `positionRootRef` is assigned during commit; first render often sees null.
  useLayoutEffect(() => {
    bumpAfterLayout()
  }, [])

  // TODO: One issue: If the formatting toolbar is open and I click into a
  // link, the toolbar instantaneously jumps to the new position. I think the
  // formatting toolbar should instantaneously close, and this timeout should
  // reset before the new toolbar appears.
  useEffect(() => {
    if (!toolbar) return

    // We wait 200ms so we don't show the toolbar unless you actually pause on the target.
    const timeout = setTimeout(() => {
      setDidWait(true)
    }, 200)

    return () => clearTimeout(timeout)
  }, [toolbar])

  if (!target) return null
  if (!open && !hasFocus && !isHovered) return null

  const root = listenerAreaRef.current
  const viewportRect =
    target instanceof Element ? target.getBoundingClientRect() : target
  const relative = root ? getPositionRelativeToRoot(root, viewportRect) : null
  const showPosition = Boolean(toolbar && didWait && relative)

  return (
    <div
      ref={setRoot}
      contentEditable={false}
      className={styles.toolbar}
      style={
        showPosition && relative && toolbar
          ? {
              left: `calc(${
                relative.left + relative.width / 2
              }px - var(--buffer-width) - ${toolbar.offsetWidth / 2}px)`,
              top: `calc(${relative.top - toolbar.offsetHeight - 2}px)`,
            }
          : {
              // Hidden until the position root ref, toolbar ref, and delay are ready.
              visibility: "hidden",
            }
      }
    >
      <div className={styles.toolbarBuffer}>
        <div className={styles.toolbarConent}>{content}</div>
      </div>
    </div>
  )
}
