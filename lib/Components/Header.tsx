import React from "react"
import { addSpaces } from "@/helpers"
import type { HeaderProps } from "@/ComponentTypes"
import { useComponents } from "@/ComponentContext"
import { styled } from "@stitches/react"

export const Header = ({
  logo,
  socialProps,
  sections,
  currentSection,
}: HeaderProps) => {
  const Components = useComponents()

  return (
    <StyledHeader>
      <StyledLogo href="/">{logo}</StyledLogo>
      <StyledHeaderLinks>
        {sections.map(({ name }) => (
          <StyledHeaderLink
            key={name}
            href={`/${name}`}
            isCurrent={currentSection?.name === name}
          >
            {addSpaces(name)}
          </StyledHeaderLink>
        ))}
        <Components.Search />
        <Components.Social {...socialProps} />
      </StyledHeaderLinks>
    </StyledHeader>
  )
}

const StyledHeader = styled("div", {
  borderBottom: "1px solid #DDD",
  padding: 24,
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const StyledLogo = styled("a", {
  display: "block",
  whiteSpace: "nowrap",
  fontWeight: 600,
  fontSize: "1.4em",
  marginTop: "-0.2em",
  marginBottom: "-0.2em",
})

const StyledHeaderLinks = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 24,
  marginRight: 24,
})

const StyledHeaderLink = styled("a", {
  variants: {
    isCurrent: {
      true: { color: "black" },
    },
  },
})
