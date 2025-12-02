import { library, type IconDefinition } from "@fortawesome/fontawesome-svg-core"
import * as Icons from "@fortawesome/free-solid-svg-icons"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useMeasure, useWindowSize } from "react-use"
import * as styles from "./Header.css"
import { FixedTopHeader, LogoIcon } from "./layout"
import { useComponents } from "~/ComponentContext"
import type { HeaderProps } from "~/ComponentTypes"
import { addSpaces } from "~/helpers/strings"
import useScrollLock from "~/helpers/useScrollLock"

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
      <Link to="/" ref={logoRef} className={styles.styledLogo}>
        {icon ? <LogoIcon color="black" icon={icon} /> : null}
        {logo}
      </Link>
      {onMobile ? (
        <Components.Button onClick={toggleMenu}>Menu</Components.Button>
      ) : null}
      <HeaderLinks
        ref={headerLinksRef}
        onMobile={onMobile}
        menuIsOpen={menuIsOpen}
      >
        {sections.map(({ name }) => {
          const isCurrent = currentSection?.name === name
          return (
            <Link
              key={name}
              to={`/${name}`}
              className={styles.headerLink({ isCurrent })}
              onClick={closeMenu}
            >
              {addSpaces(name)}
            </Link>
          )
        })}
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
      <div className={styles.headerLinksContainer({ onMobile })} ref={ref}>
        {children}
      </div>
    )
  }
)
