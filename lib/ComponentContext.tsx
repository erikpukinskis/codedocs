import type { ReactNode } from "react"
import { useContext } from "react"
import React from "react"
import { createContext } from "react"
import type { SiteSection } from "./tree"
import { type Link } from "react-router-dom"

export type LinkProps = Pick<Parameters<typeof Link>[0], "to" | "children">

export type SearchBoxProps = {
  value: string
  onChange: (query: string) => void
}

export type SocialProps = {
  githubUrl?: string
}
export type HeaderProps = {
  logo: ReactNode
  socialProps: SocialProps
  sections: SiteSection[]
  currentSection?: SiteSection
}

type LinkComponent = React.FC<LinkProps>

export type Container = React.FC<{ children: React.ReactNode }>

export type PopoverProps = {
  target: JSX.Element
  contents: JSX.Element
  isOpen: boolean
}

export type Components = {
  GlobalStyles: React.FC<Record<string, never>>
  SearchBox: React.FC<SearchBoxProps>
  Header: React.FC<HeaderProps>
  Columns: Container
  LeftColumn: Container
  MainColumn: Container
  NavLink: LinkComponent
  NavList: Container
  NavHeading: Container
  NavItem: Container
  PageHeading: Container
  DemoHeading: Container
  Link: LinkComponent
  Code: Container
  Pre: Container
  Social: React.FC<SocialProps>
  Popover: React.FC<PopoverProps>
  Card: Container
}

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
