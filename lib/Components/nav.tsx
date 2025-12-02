import { Link } from "react-router-dom"
import * as styles from "./nav.css"

export const NavList = ({ children, ...props }: React.ComponentPropsWithoutRef<"ul">) => (
  <ul className={styles.navList} {...props}>{children}</ul>
)

export const NavHeading = ({ children, ...props }: React.ComponentPropsWithoutRef<"span">) => (
  <span className={styles.navHeading} {...props}>{children}</span>
)

export const NavLink = ({ children, ...props }: React.ComponentPropsWithoutRef<typeof Link>) => (
  <Link className={styles.navLink} {...props}>{children}</Link>
)

export const NavItem = ({ children, ...props }: React.ComponentPropsWithoutRef<"li">) => (
  <li className={styles.navItem} {...props}>{children}</li>
)
