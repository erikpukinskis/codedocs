import React from "react"
import type { ArrowProps, TriggerProps, UseHoverProps } from "react-laag"
import { Arrow, useHover, useLayer } from "react-laag"
import * as styles from "./Toolbar.css"

type UseToolbarOptions = {
  triggerOffset?: number
  open?: boolean
}

type UseToolbarReturnType = {
  getTriggerProps: () => TriggerProps & UseHoverProps
  renderToolbar: (children: React.ReactNode) => React.ReactNode
}

export function useToolbar({
  triggerOffset = 8,
  open,
}: UseToolbarOptions = {}): UseToolbarReturnType {
  const [isOver, hoverProps] = useHover({ delayLeave: 100 })

  const isOpen = open ?? isOver

  const { triggerProps, layerProps, arrowProps, renderLayer } = useLayer({
    isOpen,
    triggerOffset,
  })

  return {
    getTriggerProps: () => ({ ...triggerProps, ...hoverProps }),
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
