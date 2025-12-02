import { type IconName } from "@fortawesome/fontawesome-common-types"
import type { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type React from "react"
import { type Link } from "react-router-dom"
import type { SiteSection } from "~/helpers/buildSiteTree"

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
  logo: React.ReactNode
  icon: IconName
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
  children: React.ReactNode
}

export type LogoIconProps = Parameters<typeof FontAwesomeIcon>[0]

export type ButtonProps = {
  onClick?(event: React.MouseEvent): void
  children: React.ReactNode
}

export type Components = {
  Button: React.FC<ButtonProps>
  GlobalStyles: React.FC<Record<string, never>>
  Footer: React.FC<{ copyright: string }>
  Search: React.FC<Record<string, never>>
  SearchBox: React.FC<SearchBoxProps>
  Header: React.FC<HeaderProps>
  LayoutContainer: Container
  LogoIcon: React.FC<LogoIconProps>
  Columns: Container
  FixedTopHeader: Container
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
