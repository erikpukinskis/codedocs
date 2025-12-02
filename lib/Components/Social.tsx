import React from "react"
import { Link } from "react-router-dom"
import * as styles from "./Social.css"
import type { SocialProps } from "~/ComponentTypes"
import githubLogoUrl from "~/github.png"

export const Social = ({ githubUrl }: SocialProps) =>
  githubUrl ? (
    <Link to={githubUrl} className={styles.socialLink}>
      <img alt="github repository" src={githubLogoUrl} width={24} height={24} />
    </Link>
  ) : null
