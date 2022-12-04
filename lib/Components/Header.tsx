import { library, type IconDefinition } from "@fortawesome/fontawesome-svg-core"
import * as Icons from "@fortawesome/free-solid-svg-icons"
import { styled } from "@stitches/react"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useMeasure, useWindowSize } from "react-use"
import { FixedTopHeader, LogoIcon } from "./layout"
import { useComponents } from "~/ComponentContext"
import type { HeaderProps } from "~/ComponentTypes"
import { addSpaces } from "~/helpers"

const icons = Object.keys(Icons)
  .filter((key) => key !== "fas" && key !== "prefix")
  .map((icon) => (Icons as Record<string, unknown>)[icon] as IconDefinition)

library.add(...icons)

export const Header = ({
  logo,
  icon,
  socialProps,
  sections,
  currentSection,
}: HeaderProps) => {
  const [logoRef, { width: logoWidth }] = useMeasure<HTMLAnchorElement>()

  const [headerLinksRef, { width: headerLinksWidth }] =
    useMeasure<HTMLDivElement>()
  const [menuIsOpen, setMenuOpen] = useState(false)
  const [onMobile, setOnMobile] = useState(false)

  const { width: windowWidth } = useWindowSize()

  const toggleMenu = () => {
    setMenuOpen(!menuIsOpen)
  }

  const closeMenu = () => {
    if (!onMobile) return
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!windowWidth) return
    if (!logoWidth) return

    const widthRequested = logoWidth + headerLinksWidth + 32 + 32 + 32 + 8 /////// ✨

    setOnMobile(widthRequested > windowWidth)
  }, [windowWidth, logoWidth, headerLinksWidth])

  const Components = useComponents()

  const showMenu = (onMobile && menuIsOpen) || !onMobile

  return (
    <FixedTopHeader>
      <StyledLogo to="/" ref={logoRef}>
        {icon ? <LogoIcon color="black" icon={icon} /> : null}
        {logo}
      </StyledLogo>
      {onMobile ? (
        <Components.Button onClick={toggleMenu}>Menu</Components.Button>
      ) : null}
      {showMenu ? (
        <HeaderLinks ref={headerLinksRef} onMobile={onMobile}>
          {sections.map(({ name }) => (
            <HeaderLink
              key={name}
              to={`/${name}`}
              isCurrent={currentSection?.name === name}
              onClick={closeMenu}
            >
              {addSpaces(name)}
            </HeaderLink>
          ))}
          <Components.Search />
          <Components.Social {...socialProps} />
        </HeaderLinks>
      ) : null}
    </FixedTopHeader>
  )
}

const StyledLogo = styled(Link, {
  display: "flex",
  padding: 8,
  flexDirection: "row",
  whiteSpace: "nowrap",
  marginLeft: -2,
  marginRight: 32,
  lineHeight: "16px",
})

type HeaderLinksProps = {
  onMobile: boolean
  children: React.ReactNode
}

const HeaderLinks = React.forwardRef<HTMLDivElement, HeaderLinksProps>(
  function HeaderLinks({ onMobile, children }, ref) {
    return (
      <HeaderLinksContainer onMobile={onMobile} ref={ref}>
        {children}
      </HeaderLinksContainer>
    )
  }
)

const HeaderLink = styled(Link, {
  lineHeight: "16px",
  padding: 8,

  variants: {
    isCurrent: {
      true: { color: "black" },
    },
  },
})

const HeaderLinksContainer = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 24,

  variants: {
    onMobile: {
      true: {
        position: "absolute",
        top: "var(--header-height)",
        right: 0,
        width: "100vh",
        height: "100vh",
        paddingTop: 24,
        paddingRight: 28,
        flexDirection: "column",
        background: "white",
        alignItems: "flex-end",
      },
    },
  },
})
