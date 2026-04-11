import React, { useEffect, useState } from "react"
import * as styles from "./Toolbar.css"
import { useElementObserver } from "~/hooks/useElementObserver"

type ToolbarProps = {
  id?: string
  children: React.ReactNode
  target?: HTMLElement | DOMRect | null
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

  if (!target) return null
  if (!open && !hasFocus && !isHovered) return null

  const targetLeft =
    target instanceof HTMLElement ? target.offsetLeft : target.left
  const targetWidth =
    target instanceof HTMLElement ? target.offsetWidth : target.width
  const targetTop =
    target instanceof HTMLElement ? target.offsetTop : target.top

  return (
    <span
      ref={ref}
      contentEditable={false}
      className={styles.toolbar}
      id={id}
      style={
        toolbar && didWait
          ? {
              left: `calc(${
                targetLeft + targetWidth / 2
              }px - var(--buffer-width) - ${toolbar.offsetWidth / 2}px)`,
              top: `calc(${targetTop - toolbar.offsetHeight - 2}px)`,
            }
          : {
              // We start off as hidden, then when we get a ref and find out the
              // toolbar dimensions we can position it relative to the target.
              visibility: "hidden",
            }
      }
    >
      <span className={styles.toolbarBuffer}>
        <span className={styles.toolbarConent}>{children}</span>
      </span>
    </span>
  )
}
