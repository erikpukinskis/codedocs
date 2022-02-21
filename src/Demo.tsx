import React from "react"

type DemoProps =
  | React.PropsWithChildren<{}>
  | {
      render: React.FC<{}>
    }

function hasChildren(props: DemoProps): props is React.PropsWithChildren<{}> {
  return Boolean((props as React.PropsWithChildren<{}>).children)
}

export const Demo = (props: DemoProps, foo?: boolean) =>
  hasChildren(props) ? <>{props.children}</> : <props.render />
