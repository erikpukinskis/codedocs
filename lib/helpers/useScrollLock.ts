import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock"
import { useEffect } from "react"

/**
 * Hook to lock/unlock scrolling on the document body
 * @param isLocked - Whether scrolling should be locked
 */
export default function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    const target = document.body

    if (isLocked) {
      disableBodyScroll(target, {
        reserveScrollBarGap: true,
      })
    } else {
      enableBodyScroll(target)
    }

    return () => {
      enableBodyScroll(target)
    }
  }, [isLocked])
}
