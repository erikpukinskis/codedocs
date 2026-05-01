import React, { createContext, useContext } from "react"

/**
 * Provides the frozen-block id of the current frozen wrapper to its descendants.
 *
 * The Demo component renders inside a `FrozenBlockElement` in the editor, but
 * the Demo macro doesn't directly inject the frozen id as a prop — the macro
 * just records the JSXElement in `frozenElements[id]`. The wrapper supplies
 * the id via context so the rendered Demo can wire its tab UI to the
 * matching `code-block` siblings (which carry `demoId === id`).
 *
 * Returns null when not inside a frozen block (e.g. when Demo is rendered
 * standalone in a static doc context).
 */
const FrozenIdContext = createContext<string | null>(null)

type FrozenIdProviderProps = {
  id: string
  children: React.ReactNode
}

export const FrozenIdProvider: React.FC<FrozenIdProviderProps> = ({
  id,
  children,
}) => (
  <FrozenIdContext.Provider value={id}>{children}</FrozenIdContext.Provider>
)

export function useFrozenId(): string | null {
  return useContext(FrozenIdContext)
}
