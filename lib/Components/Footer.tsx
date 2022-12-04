import { styled } from "@stitches/react"
import React from "react"
import { COLORS } from "./GlobalStyles"

const FooterContainer = styled("div", {
  paddingBottom: 64,
  position: "absolute",
  bottom: 0,
})

const Swatches = styled("div", {
  display: "flex",
  flexDirection: "row",
  gap: 16,
})

const Swatch = styled("div", {
  borderRadius: 3,
  width: 16,
  height: 16,
})

const Copyright = styled("div", {
  marginTop: 16,
  color: "#b5aaa0",
})

type FooterProps = {
  copyright: string
}

export const Footer = ({ copyright }: FooterProps) => {
  const setHoverColor = (color: string) => () => {
    document.documentElement.style.setProperty("--hover-color", color)
  }

  return (
    <FooterContainer>
      <Swatches>
        {COLORS.map((color) => (
          <Swatch
            key={color}
            style={{ background: color }}
            onClick={setHoverColor(color)}
          />
        ))}
      </Swatches>
      <Copyright>{copyright}</Copyright>
    </FooterContainer>
  )
}
