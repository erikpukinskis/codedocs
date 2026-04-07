import { Link as ReactRouterLink } from "react-router-dom"
import * as buttonStyles from "./Button.css"
import type { LinkButtonProps } from "~/ComponentTypes"

export const Link = ReactRouterLink

export const LinkButton: React.FC<LinkButtonProps> = ({
  children,
  variant,
  ...props
}) => (
  <Link {...props} className={buttonStyles.styledButton({ variant })}>
    {children}
  </Link>
)
