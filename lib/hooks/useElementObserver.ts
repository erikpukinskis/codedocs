import { useCallback, useLayoutEffect, useState } from "react"

export function useElementObserver() {
  // We want to trigger a re-render when left/top/width/height change, but we
  // don't need to return them from the hook since it's simpler just to grab
  // element.offsetWidth/offsetLeft/etc. That way consumers can do a single
  // check for element and know any properties they need on element will be
  // present.
  const [_width, setWidth] = useState<number | undefined>()
  const [_height, setHeight] = useState<number | undefined>()
  const [_left, setLeft] = useState<number | undefined>()
  const [_top, setTop] = useState<number | undefined>()
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [hasFocus, setHasFocus] = useState(false)

  const ref = useCallback(
    (element: HTMLElement | null): void => {
      setElement(element)
    },
    [setElement]
  )

  useLayoutEffect(() => {
    if (!element) return

    const syncFromElement = ({
      offsetWidth,
      offsetHeight,
      offsetLeft,
      offsetTop,
      offsetParent,
    }: HTMLElement) => {
      if (!(offsetParent instanceof HTMLElement)) {
        throw new Error(
          "useResizeObserver cannot observe elements with no offset parent (position: fixed, display: none, body/html, etc)"
        )
      }

      setWidth(offsetWidth)
      setHeight(offsetHeight)
      setLeft(offsetLeft)
      setTop(offsetTop)
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        throw new Error("ResizeObserver entry is missing?")
      }
      syncFromElement(entry.target as HTMLElement)
    })

    observer.observe(element)
    syncFromElement(element)

    const handlePointerEnter = () => setIsHovered(true)
    const handlePointerLeave = () => setIsHovered(false)
    const handleFocus = () => setHasFocus(true)
    const handleBlur = () => setHasFocus(false)
    element.addEventListener("pointerenter", handlePointerEnter)
    element.addEventListener("pointerleave", handlePointerLeave)
    element.addEventListener("focus", handleFocus)
    element.addEventListener("blur", handleBlur)

    return () => {
      observer.disconnect()
      element.removeEventListener("pointerenter", handlePointerEnter)
      element.removeEventListener("pointerleave", handlePointerLeave)
      element.removeEventListener("focus", handleFocus)
      element.removeEventListener("blur", handleBlur)
    }
  }, [element])

  return {
    ref,
    element,
    isHovered,
    hasFocus,
  }
}
