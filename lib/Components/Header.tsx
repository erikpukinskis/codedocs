import { library, type IconDefinition } from "@fortawesome/fontawesome-svg-core"
import * as Icons from "@fortawesome/free-solid-svg-icons"
import { styled } from "@stitches/react"
import React from "react"
import { Link } from "react-router-dom"
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
  const Components = useComponents()

  return (
    <FixedTopHeader>
      <StyledLogo to="/">
        {icon ? <LogoIcon color="black" icon={icon} /> : null}
        {logo}
      </StyledLogo>
      <HeaderLinks>
        {sections.map(({ name }) => (
          <HeaderLink
            key={name}
            to={`/${name}`}
            isCurrent={currentSection?.name === name}
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

const StyledLogo = styled(Link, {
  display: "flex",
  padding: 8,
  flexDirection: "row",
  whiteSpace: "nowrap",
  marginLeft: -2,
  marginRight: 32,
  lineHeight: "16px",
})

const HeaderLinks = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 24,
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
