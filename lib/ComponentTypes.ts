import type { SiteSection } from "@/tree"
import { type Link } from "react-router-dom"
import type { ReactNode } from "react"

type LinkProps = Pick<Parameters<typeof Link>[0], "to" | "children">

export type SearchBoxProps = {
  inputProps: {
    onChange: React.ChangeEventHandler<HTMLInputElement>
    role: string
    "aria-expanded": boolean
    "aria-activedescendant": string | undefined
    "aria-label": string
    value: string
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
    ref: (element: HTMLElement | null) => void
    onFocus: (event: React.SyntheticEvent) => void
    onBlur: (event: React.SyntheticEvent) => void
  }
  onClickClear: () => void
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

export type Container = React.FC<{ children: React.ReactNode }>

export type PopoverProps = {
  target: JSX.Element
  contents: JSX.Element | null
}

export type CardProps = {
  pad?: "default" | "top-and-bottom"
  role?: React.HTMLAttributes<HTMLDivElement>["role"]
  onMouseOver?: () => void
}

export type Components = {
  GlobalStyles: React.FC<Record<string, never>>
  Search: React.FC<Record<string, never>>
  SearchBox: React.FC<SearchBoxProps>
  Header: React.FC<HeaderProps>
  Columns: Container
  LeftColumn: Container
  MainColumn: Container
  CenterColumn: Container
  NavLink: React.FC<LinkProps>
  NavList: Container
  NavHeading: Container
  NavItem: Container
  PageHeading: Container
  DemoHeading: Container
  Link: React.FC<LinkProps>
  Social: React.FC<SocialProps>
  Popover: React.FC<PopoverProps>
  Card: React.FC<CardProps>
}
