import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import * as styles from "./layout.css"

export const LayoutContainer = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => (
  <div className={styles.layoutContainer} {...props}>
    {children}
  </div>
)

export const Columns = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => (
  <div className={styles.columns} {...props}>
    {children}
  </div>
)

export const LogoIcon = (
  props: React.ComponentPropsWithoutRef<typeof FontAwesomeIcon>
) => <FontAwesomeIcon className={styles.logoIcon} {...props} />

export const FixedTopHeader = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => (
  <div className={styles.fixedTopHeader} {...props}>
    {children}
  </div>
)

export const LeftColumn = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"nav">) => (
  <nav className={styles.leftColumn} {...props}>
    {children}
  </nav>
)

export const MainColumn = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => (
  <div className={styles.mainColumn} {...props}>
    {children}
  </div>
)

export const CenterColumn = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => (
  <div className={styles.centerColumn} {...props}>
    {children}
  </div>
)
