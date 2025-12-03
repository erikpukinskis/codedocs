import { placeholderClass } from "./Placeholder.css"

export const Placeholder = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => (
  <div className={placeholderClass} {...props}>
    {children}
  </div>
)
