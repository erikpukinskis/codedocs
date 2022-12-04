import type { ReactNode } from "react"
import React, { useContext, createContext } from "react"
import type { Components } from "./ComponentTypes"

type ComponentContextProviderProps = {
  Components: Components
  children: ReactNode
}

const ComponentContext = createContext<Components>({} as Components)

export const ComponentContextProvider = ({
  Components,
  children,
}: ComponentContextProviderProps) => {
  return (
    <ComponentContext.Provider value={Components}>
      <Components.GlobalStyles />
      {children}
    </ComponentContext.Provider>
  )
}

export const useComponents = () => {
  const Components = useContext(ComponentContext)
  if (!Components.Link) {
    throw new Error(
      "Cannot use useComponents outside of a ComponentContextProvider"
    )
  }
  return Components
}
