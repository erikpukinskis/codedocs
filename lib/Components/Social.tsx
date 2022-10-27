import githubLogoUrl from "@/github.png"
import type { SocialProps } from "@/ComponentContext"
import React from "react"

export const Social = ({ githubUrl }: SocialProps) =>
  githubUrl ? (
    <a href={githubUrl}>
      <img src={githubLogoUrl} width={24} height={24} />
    </a>
  ) : null
