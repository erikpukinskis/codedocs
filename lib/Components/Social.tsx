import githubLogoUrl from "@/github.png"
import type { SocialProps } from "@/ComponentTypes"
import React from "react"
import { styled } from "@stitches/react"
import { Link } from "react-router-dom"

export const Social = ({ githubUrl }: SocialProps) =>
  githubUrl ? (
    <StyledHeaderLink to={githubUrl}>
      <img alt="github repository" src={githubLogoUrl} width={24} height={24} />
    </StyledHeaderLink>
  ) : null

const StyledHeaderLink = styled(Link, {
  lineHeight: 0,
  padding: 4,
  boxSizing: "border-box",
})
