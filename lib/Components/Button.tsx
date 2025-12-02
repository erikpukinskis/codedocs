import React from "react"
import type { ButtonProps } from "~/ComponentTypes"
import * as styles from "./Button.css"

export const Button = ({ onClick, children }: ButtonProps) => (
  <button onClick={onClick} className={styles.styledButton}>
    {children}
  </button>
)
