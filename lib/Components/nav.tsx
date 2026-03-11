import { Link } from "react-router-dom"
import * as styles from "./nav.css"
import type { NavLinkProps } from "~/ComponentTypes"

export const NavList = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"ul">) => (
  <ul className={styles.navList} {...props}>
    {children}
  </ul>
)

export const NavHeading = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"span">) => (
  <span className={styles.navHeading} {...props}>
    {children}
  </span>
)

export const NavLink = ({ children, current, ...props }: NavLinkProps) => (
  <Link className={styles.navLink({ current })} {...props}>
    {children}
  </Link>
)

export const NavItem = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"li">) => (
  <li className={styles.navItem} {...props}>
    {children}
  </li>
)
