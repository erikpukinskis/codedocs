import React from "react"
import type { ArrowProps, TriggerProps, UseHoverProps } from "react-laag"
import { Arrow, useHover, useLayer } from "react-laag"
import * as styles from "./Toolbar.css"

type UseToolbarOptions = {
  triggerOffset?: number
  open?: boolean
  /**
   * When set, the bubble is positioned from this rect (no DOM trigger or hover).
   * Pass `open` explicitly; typically `true` when the rect is non-null.
   */
  getTriggerBounds?: () => DOMRect | ClientRect | null
}

type UseToolbarReturnType = {
  getTriggerProps: () => (TriggerProps & UseHoverProps) | undefined
  renderToolbar: (children: React.ReactNode) => React.ReactNode
}

export function useToolbar({
  triggerOffset = 8,
  open,
  getTriggerBounds,
}: UseToolbarOptions = {}): UseToolbarReturnType {
  const [isOver, hoverProps] = useHover({
    delayLeave: 100,
  })

  const isOpen = getTriggerBounds ? Boolean(open) : open ?? isOver

  const { triggerProps, layerProps, arrowProps, renderLayer } = useLayer({
    isOpen,
    triggerOffset,
    overflowContainer: false,
    ...(getTriggerBounds
      ? {
          trigger: {
            getBounds: () => getTriggerBounds() ?? new DOMRect(0, 0, 0, 0),
          },
        }
      : {}),
  })

  return {
    getTriggerProps: () =>
      getTriggerBounds ? undefined : { ...triggerProps, ...hoverProps },
    renderToolbar: (children) => {
      if (!isOpen) return null

      return renderLayer(
        <div {...layerProps} {...hoverProps} className={styles.toolbar}>
          <div className={styles.toolbarBuffer}>
            <div className={styles.toolbarConent}>{children}</div>
          </div>
          <Arrow
            {...(arrowProps as unknown as React18ArrowProps)}
            backgroundColor="#444"
            size={5}
          />
        </div>
      )
    },
  }
}

type React18ArrowProps = ArrowProps & {
  onPointerEnterCapture: () => void
  onPointerLeaveCapture: () => void
}
