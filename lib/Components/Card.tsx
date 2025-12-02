import React from "react"
import * as styles from "./Card.css"
import { type CardProps } from "~/ComponentTypes"

export const Card = ({
  children,
  pad,
  ...props
}: CardProps & React.ComponentPropsWithoutRef<"div">) => (
  <div className={styles.card({ pad })} {...props}>
    {children}
  </div>
)
