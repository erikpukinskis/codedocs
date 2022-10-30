import { useRef, useMemo, useCallback } from "react"
import { generate } from "short-uuid"

/**
 * Note that there's a HOC-based version of this by @etheryte that seems pretty
 * decent. We may want to use that instead some day:
 *
 * https://github.com/Etheryte/focus-group/blob/main/src/lib/FocusGroup.tsx
 *
 * That approach listens for focus on the container, where this useFocusGroup
 * listens for focus on each element that you manually spread
 * {...focusGroupProps} onto. I do remember there being some IE11 issues with
 * listening for focus on containers, so maybe that's the only advantage to this
 * approach.
 */

type FocusGroupOptions = {
  onFocus?: () => void
  onBlur?: () => void
}

export const useFocusGroup = ({ onFocus, onBlur }: FocusGroupOptions) => {
  const elementsByIdRef = useRef<Record<string, HTMLElement>>({})
  const focusedElementRef = useRef<HTMLElement | undefined>()
  const callbackTimeoutRef = useRef<NodeJS.Timeout | undefined>()
  const lastReportedStateRef = useRef<"focused" | "blurred">("blurred")
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | undefined>()

  const focusGroupProps = useMemo(
    () => ({
      ref: function focusGroupCallbackRef(element: HTMLElement | null) {
        console.log("called back", element)

        if (element) {
          const id = generate()
          element.dataset.focusGroupMemberId = id
          elementsByIdRef.current[id] = element
          console.log("added one:", Object.keys(elementsByIdRef.current))
        } else {
          if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current)
          }

          cleanupTimeoutRef.current = setTimeout(() => {
            for (const id in elementsByIdRef.current) {
              if (!elementsByIdRef.current[id].isConnected) {
                if (focusedElementRef.current === elementsByIdRef.current[id]) {
                  focusedElementRef.current = undefined
                  onBlur?.()
                  lastReportedStateRef.current = "blurred"
                }
                delete elementsByIdRef.current[id]
              }
            }
            console.log("deleted some?", Object.keys(elementsByIdRef.current))
          })
        }
      },
      onFocus: function focusGroupHandleFocus(event: React.SyntheticEvent) {
        if (!(event.target instanceof HTMLElement)) {
          throw new Error(
            "useFocusGroup received a focus event from something other than an element"
          )
        }
        focusedElementRef.current = event.target

        console.log("focused", event.target.dataset.focusGroupMemberId)

        if (lastReportedStateRef.current === "blurred") {
          if (callbackTimeoutRef.current) {
            clearTimeout(callbackTimeoutRef.current)
          }
          callbackTimeoutRef.current = setTimeout(() => {
            if (focusedElementRef.current) {
              onFocus?.()
              lastReportedStateRef.current = "focused"
            }
          })
        }
      },
      onBlur: function focusGroupHandleBlur(event: React.SyntheticEvent) {
        focusedElementRef.current = undefined

        if (event.target instanceof HTMLElement) {
          console.log("blurred", event.target.dataset.focusGroupMemberId)
        }

        if (lastReportedStateRef.current === "focused") {
          if (callbackTimeoutRef.current) {
            clearTimeout(callbackTimeoutRef.current)
          }
          callbackTimeoutRef.current = setTimeout(() => {
            if (!focusedElementRef.current) {
              onBlur?.()
              lastReportedStateRef.current = "blurred"
            }
          })
        }
      },
    }),
    []
  )

  const focus = useCallback((selector: string) => {
    for (const id in elementsByIdRef.current) {
      const element = elementsByIdRef.current[id]
      if (element.matches(selector)) {
        element.focus()
        return
      }
    }
  }, [])

  const blur = useCallback((selector: string) => {
    for (const id in elementsByIdRef.current) {
      const element = elementsByIdRef.current[id]
      if (element.matches(selector)) {
        element.blur()
        return
      }
    }
  }, [])

  return useMemo(
    () => ({
      focusGroupProps,
      focus,
      blur,
    }),
    [focusGroupProps, focus]
  )
}
