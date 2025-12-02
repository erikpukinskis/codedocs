import React from "react"
import * as styles from "./Button.css"

export const Button = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"button">) => (
  <button className={styles.button} {...props}>
    {children}
  </button>
)
