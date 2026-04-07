import React from "react"
import * as styles from "./Button.css"
import type { ButtonProps } from "~/ComponentTypes"

export const Button = ({
  onClick,
  children,
  variant = "default",
  "aria-label": ariaLabel,
  disabled,
}: ButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    disabled={disabled}
    className={styles.styledButton({ variant })}
  >
    {children}
  </button>
)
