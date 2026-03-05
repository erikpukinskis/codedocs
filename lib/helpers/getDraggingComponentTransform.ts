/**
 * Calculates the transform to apply to an element we're dragging, assuming it
 * has been scaled to 0.5 scale, with transform-origin at the center.
 *
 * These values are used to set the --drag-tx and --drag-ty CSS variables.
 *
 * Examples on an 80x16 rectangle element:
 *
 * ```
 *    // Dragging from the top left corner:
 *    cx = 0
 *    cy = 0
 *    width = 80
 *    height = 16
 *    // element is 40px wide (after scaling), and starts 20px to the right of the cursor, so:
 *    translateX = -40
 *    // element is 8px tall, and starts 4px below the cursor, so:
 *    translateY = -8
 *
 *    // Dragging from the exact center:
 *    cx = 40
 *    cy = 8
 *    translateX = 0
 *    translateY = 0
 *
 *    // Dragging from the bottom right corner:
 *    cx = 80
 *    cy = 16
 *    translateX = 40
 *    translateY = 8
 * ```
 */
export function getDraggingComponentTransform(
  rect: DOMRect,
  event: PointerEvent
) {
  /** Distances between the cursor and the top left cornerof the component */
  const cx = event.clientX - rect.left
  const cy = event.clientY - rect.top

  /** Percentage the cursor has moved from the center of the component (negative values are left, positive values are right) */
  const pctX = cx / rect.width - 0.5
  const pctY = cy / rect.height - 0.5

  const tx = pctX * rect.width
  const ty = pctY * rect.height

  return { tx, ty }
}
