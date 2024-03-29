import React from "react"
import { useLayer, useHover } from "react-laag"
import type { PopoverProps } from "~/ComponentTypes"

export const Popover = ({ target, contents }: PopoverProps) => {
  const [, hoverProps] = useHover()

  const { triggerProps, layerProps, renderLayer } = useLayer({
    isOpen: Boolean(contents),
    placement: "bottom-start",
    triggerOffset: 4,
  })

  return (
    <>
      <span {...triggerProps} {...hoverProps}>
        {target}
      </span>
      {contents && renderLayer(<div {...layerProps}>{contents}</div>)}
    </>
  )
}
