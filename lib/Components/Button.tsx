import React from "react"
import * as styles from "./Button.css"
import type { ButtonProps } from "~/ComponentTypes"

export const Button = ({
  onClick,
  children,
  secondary,
  inline,
}: ButtonProps) => (
  <button
    onClick={onClick}
    className={styles.styledButton({ secondary, inline })}
  >
    {children}
  </button>
)
