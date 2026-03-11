import React, { useLayoutEffect, useRef } from "react"
import { CropMarks } from "./CropMarks"

type PreviewAreaProps = {
  children: React.ReactNode
  boundingSelectors?: string[]
  inline?: boolean
}

export function PreviewArea({
  children,
  boundingSelectors,
  inline = true,
}: PreviewAreaProps) {
  const areaRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!areaRef.current || !boundingSelectors?.length) return

    const container = areaRef.current
    const containerRect = container.getBoundingClientRect()

    let minX = 0
    let minY = 0
    let maxX = containerRect.width
    let maxY = containerRect.height

    for (const selector of boundingSelectors) {
      const elements = Array.from(container.querySelectorAll(selector))
      for (const el of elements) {
        const rect = el.getBoundingClientRect()
        minX = Math.min(minX, rect.left - containerRect.left)
        minY = Math.min(minY, rect.top - containerRect.top)
        maxX = Math.max(maxX, rect.right - containerRect.left)
        maxY = Math.max(maxY, rect.bottom - containerRect.top)
      }
    }

    const paddingLeft = Math.abs(Math.min(0, minX))
    const paddingTop = Math.abs(Math.min(0, minY))
    const paddingRight = Math.max(0, maxX - containerRect.width)
    const paddingBottom = Math.max(0, maxY - containerRect.height)

    container.style.paddingLeft = `${paddingLeft}px`
    container.style.paddingTop = `${paddingTop}px`
    container.style.paddingRight = `${paddingRight}px`
    container.style.paddingBottom = `${paddingBottom}px`
  }, [boundingSelectors])

  return (
    <div
      ref={areaRef}
      data-component="PreviewArea"
      style={{
        display: "inline-block",
        width: inline ? "auto" : "100%",
        maxWidth: "100%",
      }}
    >
      <div style={{ position: "relative" }}>
        <div
          data-description="content wrapper"
          style={{
            isolation: "isolate",
            position: "relative",
            zIndex: 1,
            /**
             * If this is display: block then it will have line height, which
             * effectively gives the PreviewArea a min-height.
             */
            display: "flex",
          }}
        >
          {children}
        </div>
        <div
          data-description="crop marks wrapper"
          style={{
            zIndex: 0,
            isolation: "isolate",
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            right: 0,
          }}
        >
          <CropMarks />
        </div>
      </div>
    </div>
  )
}
