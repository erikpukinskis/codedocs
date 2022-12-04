import { styled } from "@stitches/react"
import React from "react"
import { Link } from "react-router-dom"
import type { SocialProps } from "~/ComponentTypes"
import githubLogoUrl from "~/github.png"

export const Social = ({ githubUrl }: SocialProps) =>
  githubUrl ? (
    <SocialLink to={githubUrl}>
      <img alt="github repository" src={githubLogoUrl} width={24} height={24} />
    </SocialLink>
  ) : null

const SocialLink = styled(Link, {
  lineHeight: 0,
  padding: 4,
  boxSizing: "border-box",
})
