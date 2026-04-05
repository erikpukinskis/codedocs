import React from "react"
import type {
  ArrowProps,
  LayerProps,
  TriggerProps,
  UseHoverProps,
} from "react-laag"
import { Arrow, useHover, useLayer } from "react-laag"
import * as styles from "./Toolbar.css"

type UseToolbarOptions = {
  triggerOffset?: number
  open?: boolean
}

type UseToolbarReturnType = {
  getTriggerProps: () => TriggerProps & UseHoverProps
  Toolbar: React.FC<{ children: React.ReactNode }>
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
    Toolbar: ({ children }) => (
      <Toolbar
        isOpen={isOpen}
        hoverProps={hoverProps}
        renderLayer={renderLayer}
        layerProps={layerProps}
        arrowProps={arrowProps as unknown as React18ArrowProps}
      >
        {children}
      </Toolbar>
    ),
  }
}

type React18ArrowProps = ArrowProps & {
  onPointerEnterCapture: () => void
  onPointerLeaveCapture: () => void
}

type ToolbarProps = {
  isOpen: boolean
  hoverProps: UseHoverProps
  children: React.ReactNode
  renderLayer: (children: React.ReactNode) => React.ReactPortal | null
  layerProps: LayerProps
  arrowProps: React18ArrowProps
}

const Toolbar: React.FC<ToolbarProps> = ({
  children,
  isOpen,
  hoverProps,
  layerProps,
  arrowProps,
  renderLayer,
}) => {
  if (!isOpen) return null

  console.debug("arrowProps", arrowProps)
  return renderLayer(
    <div {...layerProps} {...hoverProps} className={styles.toolbar}>
      <div className={styles.toolbarBuffer}>
        <div className={styles.toolbarConent}>{children}</div>
      </div>
      <Arrow {...arrowProps} backgroundColor="#667" size={5} />
    </div>
  )
}
