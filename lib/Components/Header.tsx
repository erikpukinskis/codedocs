import { library, type IconDefinition } from "@fortawesome/fontawesome-svg-core"
import * as Icons from "@fortawesome/free-solid-svg-icons"
import { styled } from "@stitches/react"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useMeasure, useWindowSize } from "react-use"
import { FixedTopHeader, LogoIcon } from "./layout"
import { useComponents } from "~/ComponentContext"
import type { HeaderProps } from "~/ComponentTypes"
import { addSpaces } from "~/helpers/strings"
import useScrollLock from "~/helpers/useScrollLock"

const icons = Object.keys(Icons)
  .filter((key) => key !== "fas" && key !== "prefix")
  .map((icon) => (Icons as Record<string, unknown>)[icon] as IconDefinition)

library.add(...icons)

const StyledLogo = styled(Link, {
  display: "flex",
  padding: 8,
  flexDirection: "row",
  whiteSpace: "nowrap",
  marginLeft: -2,
  marginRight: 32,
  lineHeight: "16px",
})

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
        left: 0,
        height: "100vh",
        paddingTop: 24,
        paddingRight: 28,
        boxSizing: "border-box",
        flexDirection: "column",
        background: "white",
        alignItems: "flex-end",
      },
    },
  },
})

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
  const [desktopHeaderLinksWidth, setDesktopHeaderLinksWidth] = useState<
    undefined | number
  >()
  const { width: windowWidth } = useWindowSize()
  useScrollLock(menuIsOpen)
  const Components = useComponents()
  const [mobileHeaderLinksWidth, setMobileHeaderLinksWidth] = useState<
    number | undefined
  >()

  useEffect(() => {
    if (!headerLinksWidth) return

    // This is a bit complicated because we rely on the "header width" to
    // determine whether we should switch to the mobile view, but that header
    // width changes when we switch to mobile! So we need to separate out the
    // measured desktop width from the mobile width, and not using one for the
    // other. Ideally if onMobile=false, useMeasure would never return values
    // from the render when onMobile was true. But in practice there is a race
    // condition there, between when onMobile becomes false and when the menu
    // changes style.
    if (onMobile && headerLinksWidth !== desktopHeaderLinksWidth) {
      setMobileHeaderLinksWidth(headerLinksWidth)
    }

    if (!onMobile && headerLinksWidth !== mobileHeaderLinksWidth) {
      setDesktopHeaderLinksWidth(headerLinksWidth)
    }
  }, [onMobile, headerLinksWidth])

  useEffect(() => {
    if (!logoWidth) return
    if (!desktopHeaderLinksWidth) return

    const widthRequested =
      logoWidth + desktopHeaderLinksWidth + 32 + 32 + 32 + 8 /////// ✨

    setOnMobile(widthRequested > windowWidth)
  }, [windowWidth, logoWidth, desktopHeaderLinksWidth])

  const toggleMenu = () => {
    setMenuOpen(!menuIsOpen)
  }

  const closeMenu = () => {
    if (!onMobile) return
    setMenuOpen(false)
  }

  return (
    <FixedTopHeader>
      <StyledLogo to="/" ref={logoRef}>
        {icon ? <LogoIcon color="black" icon={icon} /> : null}
        {logo}
      </StyledLogo>
      {onMobile ? (
        <Components.Button onClick={toggleMenu}>Menu</Components.Button>
      ) : null}
      <HeaderLinks
        ref={headerLinksRef}
        onMobile={onMobile}
        menuIsOpen={menuIsOpen}
      >
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
    </FixedTopHeader>
  )
}

type HeaderLinksProps = {
  onMobile: boolean
  menuIsOpen: boolean
  children: React.ReactNode
}

const HeaderLinks = React.forwardRef<HTMLDivElement, HeaderLinksProps>(
  function HeaderLinks({ onMobile, menuIsOpen, children }, ref) {
    if (onMobile && !menuIsOpen) return null
    return (
      <HeaderLinksContainer onMobile={onMobile} ref={ref}>
        {children}
      </HeaderLinksContainer>
    )
  }
)
