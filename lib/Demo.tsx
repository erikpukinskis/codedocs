import React from "react"

type DemoProps =
  | React.PropsWithChildren<null>
  | {
      render: React.FC<null>
    }

function hasChildren(props: DemoProps): props is React.PropsWithChildren<null> {
  return Boolean((props as React.PropsWithChildren<null>).children)
}

export const Demo = (props: DemoProps) =>
  hasChildren(props) ? <>{props.children}</> : <props.render />
