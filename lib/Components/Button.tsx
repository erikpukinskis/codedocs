import React from "react"
import * as styles from "./Button.css"
import type { ButtonProps } from "~/ComponentTypes"

export const Button = ({ onClick, children }: ButtonProps) => (
  <button onClick={onClick} className={styles.styledButton}>
    {children}
  </button>
)
