import { describe, it, expect } from "vitest"
import { getDraggingComponentTransform } from "./getDraggingComponentTransform"

describe("getDraggingComponentTransform", () => {
  it("should move left when dragging from the left side", () => {
    const rect = {
      left: 0,
      top: 0,
      width: 80,
      height: 16,
    } as DOMRect

    const event = {
      clientX: 0,
      clientY: 0,
    } as PointerEvent

    const result = getDraggingComponentTransform(rect, event)

    expect(result).toBe("scale(0.5) translateX(-40px) translateY(-8px)")
  })

  it("should stay dead center when dragging from the center", () => {
    const rect = {
      left: 0,
      top: 0,
      width: 80,
      height: 16,
    } as DOMRect

    const event = {
      clientX: 40,
      clientY: 8,
    } as PointerEvent

    const result = getDraggingComponentTransform(rect, event)

    expect(result).toBe("scale(0.5) translateX(0px) translateY(0px)")
  })

  it("should move right when dragging from the right side", () => {
    const rect = {
      left: 0,
      top: 0,
      width: 80,
      height: 16,
    } as DOMRect

    const event = {
      clientX: 80,
      clientY: 16,
    } as PointerEvent

    const result = getDraggingComponentTransform(rect, event)

    expect(result).toBe("scale(0.5) translateX(40px) translateY(8px)")
  })
})
