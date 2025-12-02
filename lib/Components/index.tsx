import React from "react"
import { Link as _Link } from "react-router-dom"
import * as styles from "./index.css"

export * from "./Search"
export { GlobalStyles } from "./GlobalStyles"
export * from "./Popover"
export * from "./Header"
export * from "./Card"
export * from "./SearchBox"
export * from "./nav"
export * from "./Social"
export * from "./layout"
export * from "./Footer"
export * from "./Button"

export const Link = _Link

export const PageHeading = ({ children, ...props }: React.ComponentPropsWithoutRef<"h1">) => (
  <h1 className={styles.pageHeading} {...props}>
    {children}
  </h1>
)

export const DemoHeading = ({ children, ...props }: React.ComponentPropsWithoutRef<"h2">) => (
  <h2 className={styles.demoHeading} {...props}>
    {children}
  </h2>
)
