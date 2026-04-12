import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import * as styles from "./Toolbar.css"
import { useElementObserver } from "~/hooks/useElementObserver"

type OutletRelativeRect = {
  left: number
  top: number
  width: number
  height: number
}

function getOutletRelativeRect(
  outlet: HTMLElement,
  rect: Pick<DOMRectReadOnly, "left" | "top" | "width" | "height">
): OutletRelativeRect {
  const o = outlet.getBoundingClientRect()
  return {
    left: rect.left - o.left,
    top: rect.top - o.top,
    width: rect.width,
    height: rect.height,
  }
}

type ToolbarProps = {
  id: string
  children: React.ReactNode
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

export const Toolbar: React.FC<ToolbarProps> = ({
  id,
  children,
  target,
  open,
}) => {
  const { ref, element: toolbar, hasFocus, isHovered } = useElementObserver()
  const [didWait, setDidWait] = useState(false)

  useEffect(() => {
    if (!toolbar) return

    // We wait 200ms so we don't show the toolbar unless you actually pause on the target.
    const timeout = setTimeout(() => {
      setDidWait(true)
    }, 200)

    return () => clearTimeout(timeout)
  }, [toolbar])

  const outletElement = document.getElementById(`toolbar-outlet-${id}`)

  if (!target) return null
  if (!open && !hasFocus && !isHovered) return null
  if (!(outletElement instanceof HTMLElement)) return null

  const viewportRect =
    target instanceof Element ? target.getBoundingClientRect() : target
  const { left, top, width } = getOutletRelativeRect(
    outletElement,
    viewportRect
  )

  return createPortal(
    <div
      ref={ref}
      contentEditable={false}
      className={styles.toolbar}
      id={id}
      style={
        toolbar && didWait
          ? {
              left: `calc(${left + width / 2}px - var(--buffer-width) - ${
                toolbar.offsetWidth / 2
              }px)`,
              top: `calc(${top - toolbar.offsetHeight - 2}px)`,
            }
          : {
              // We start off as hidden, then when we get a ref and find out the
              // toolbar dimensions we can position it relative to the target.
              visibility: "hidden",
            }
      }
    >
      <div className={styles.toolbarBuffer}>
        <div className={styles.toolbarConent}>{children}</div>
      </div>
    </div>,
    outletElement
  )
}

type ToolbarOutletProps = {
  toolbar: string
}

export const ToolbarOutlet: React.FC<ToolbarOutletProps> = ({ toolbar }) => {
  return (
    <div
      role="region"
      id={`toolbar-outlet-${toolbar}`}
      data-component="ToolbarOutlet"
      className={styles.toolbarOutlet}
    ></div>
  )
}
