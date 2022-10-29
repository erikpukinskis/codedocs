import githubLogoUrl from "@/github.png"
import type { SocialProps } from "@/ComponentTypes"
import React from "react"
import { styled } from "@stitches/react"

export const Social = ({ githubUrl }: SocialProps) =>
  githubUrl ? (
    <StyledHeaderLink href={githubUrl}>
      <img src={githubLogoUrl} width={24} height={24} />
    </StyledHeaderLink>
  ) : null

const StyledHeaderLink = styled("a", {
  lineHeight: 0,
})
