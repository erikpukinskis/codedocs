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

const isElement = (target: EventTarget): target is HTMLElement => {
  return target instanceof HTMLElement
}

export const useFocusGroup = ({ onFocus, onBlur }: FocusGroupOptions) => {
  const elementsByIdRef = useRef<Record<string, HTMLElement>>({})
  const focusedElementRef = useRef<HTMLElement | undefined>()
  const callbackTimeoutRef = useRef<NodeJS.Timeout | undefined>()
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
                delete elementsByIdRef.current[id]
              }
            }
            console.log("deleted some?", Object.keys(elementsByIdRef.current))
          })
        }
      },
      onFocus: function focusGroupHandleFocus(event: React.SyntheticEvent) {
        const wasFocused = Boolean(focusedElementRef.current)
        if (!isElement(event.target)) {
          throw new Error(
            "useFocusGroup received a focus event from something other than an element"
          )
        }
        focusedElementRef.current = event.target

        if (!wasFocused) {
          if (callbackTimeoutRef.current) {
            clearTimeout(callbackTimeoutRef.current)
          }
          callbackTimeoutRef.current = setTimeout(() => {
            if (focusedElementRef.current) {
              onFocus?.()
            }
          })
        }
      },
      onBlur: function focusGroupHandleBlur() {
        const wasFocused = Boolean(focusedElementRef.current)
        focusedElementRef.current = undefined

        if (wasFocused) {
          if (callbackTimeoutRef.current) {
            clearTimeout(callbackTimeoutRef.current)
          }
          callbackTimeoutRef.current = setTimeout(() => {
            if (!focusedElementRef.current) {
              onBlur?.()
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

  return useMemo(
    () => ({
      focusGroupProps,
      focus,
    }),
    [focusGroupProps, focus]
  )
}
