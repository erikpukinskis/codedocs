import { placeholderClass } from "./Placeholder.css"

export const Placeholder = ({
  children,
  ...props
}: React.ComponentProps<"div">) => (
  <div className={placeholderClass} {...props}>
    {children}
  </div>
)
