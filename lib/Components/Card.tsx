import type React from "react"
import { type CardProps } from "~/ComponentTypes"
import * as styles from "./Card.css"

export const Card = ({ children, pad, ...props }: CardProps & React.ComponentPropsWithoutRef<"div">) => (
  <div className={styles.card({ pad })} {...props}>
    {children}
  </div>
)
