import React, { type ReactNode } from "react"

type HasChildren = {
  children: ReactNode
}

type Renderable = {
  render: React.FC<unknown>
}

type DemoProps = HasChildren | Renderable

function hasChildren(props: DemoProps): props is HasChildren {
  return Boolean((props as HasChildren).children)
}

export const Demo = (props: DemoProps) =>
  hasChildren(props) ? <>{props.children}</> : <props.render />
