import { useCallback, useRef } from "react"

/**
 * Takes multiple refs and merges them into a single ref function.
 *
 * Only updates the merged function if one of the refs has changed. So if you're
 * being careful about memoizing your refs, mergeRefs should respect that.
 */
export function useMergedRefs(...refs: unknown[]) {
  const oldRefs = useRef(refs as React.Ref<HTMLElement | null>[])

  // It's pretty common for refs to change every render, but just in case the
  // consumer is being careful to have stable refs, we check to see if at least
  // one of the refs changed identity before updating the current state of
  // oldRefs, which triggers a new merged callback ref to be created below.
  for (let i = 0; i < Math.max(oldRefs.current.length, refs.length); i++) {
    const oldRef = oldRefs.current[i]
    const newRef = refs[i]

    if (oldRef !== newRef) {
      oldRefs.current = refs as React.Ref<HTMLElement | null>[]
      break
    }
  }

  return useCallback(
    (element: HTMLElement | null) => {
      oldRefs.current.forEach((ref) => {
        if (typeof ref === "function") {
          ref(element)
        } else if (ref != null) {
          ref.current = element
        }
      })
    },
    // Note that using refs as dependencies is generally suspect, but it's very
    // intentional in this case (see the loop above).
    [oldRefs.current]
  )
}
