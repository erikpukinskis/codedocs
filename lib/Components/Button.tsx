import React from "react"
import * as styles from "./Button.css"
import type { ButtonProps, LinkButtonProps } from "~/ComponentTypes"

export const Button = ({ onClick, children }: ButtonProps) => (
  <button onClick={onClick} className={styles.styledButton}>
    {children}
  </button>
)

export const LinkButton = ({ onClick, children }: LinkButtonProps) => (
  <button onClick={onClick} className={styles.linkButton}>
    {children}
  </button>
)
