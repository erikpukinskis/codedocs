import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

/**
 * Visibility state for demo source code-blocks.
 *
 * Demo source lives in the Slate document as `code-block` siblings tagged with
 * `demoId` and `tab`. They are HIDDEN by default (the editor's renderElement
 * collapses them and arrow-key navigation skips them) and made visible by the
 * Demo's tab UI. State shape: `Record<demoId, tab | null>` — at most one tab
 * visible per demo.
 *
 * Visibility is editor state, not document state: switching tabs doesn't
 * dirty the document, and the source code-blocks stay in the tree even when
 * not rendered (so Slate's selection / copy / paste / serialization continue
 * to work without conditional branches).
 */
export type DemoSourceVisibility = {
  isVisible: (demoId: string, tab: string) => boolean
  /** Returns the currently visible tab for the demo, or null. */
  visibleTabFor: (demoId: string) => string | null
  /** Show this tab (and hide any other tab for the same demo). */
  show: (demoId: string, tab: string) => void
  /** Hide all tabs for this demo. */
  hide: (demoId: string) => void
}

const DemoSourceVisibilityContext = createContext<DemoSourceVisibility | null>(
  null
)

type DemoSourceVisibilityProviderProps = {
  children: React.ReactNode
}

export const DemoSourceVisibilityProvider: React.FC<
  DemoSourceVisibilityProviderProps
> = ({ children }) => {
  const [visibleTabs, setVisibleTabs] = useState<Record<string, string | null>>(
    {}
  )

  const isVisible = useCallback(
    (demoId: string, tab: string) => visibleTabs[demoId] === tab,
    [visibleTabs]
  )

  const visibleTabFor = useCallback(
    (demoId: string) => visibleTabs[demoId] ?? null,
    [visibleTabs]
  )

  const show = useCallback((demoId: string, tab: string) => {
    setVisibleTabs((prev) => ({ ...prev, [demoId]: tab }))
  }, [])

  const hide = useCallback((demoId: string) => {
    setVisibleTabs((prev) => ({ ...prev, [demoId]: null }))
  }, [])

  const value = useMemo<DemoSourceVisibility>(
    () => ({ isVisible, visibleTabFor, show, hide }),
    [isVisible, visibleTabFor, show, hide]
  )

  return (
    <DemoSourceVisibilityContext.Provider value={value}>
      {children}
    </DemoSourceVisibilityContext.Provider>
  )
}

/**
 * Returns the visibility controller. Falls back to a "always hidden" no-op
 * implementation when used outside a provider — this lets the Demo component
 * render outside the editor (e.g. in static doc mode) without throwing.
 */
export function useDemoSourceVisibility(): DemoSourceVisibility {
  const ctx = useContext(DemoSourceVisibilityContext)
  if (ctx) return ctx
  return ALWAYS_HIDDEN
}

const noop = () => undefined

const ALWAYS_HIDDEN: DemoSourceVisibility = {
  isVisible: () => false,
  visibleTabFor: () => null,
  show: noop,
  hide: noop,
}
