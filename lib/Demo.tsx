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

export const Demo = (props: DemoProps) => {
  if (hasChildren(props)) {
    if (typeof props.children === "function") {
      throw new Error(
        `Don't pass function children to <Demo>, pass a render function like: <Demo render={() => ... } />`
      )
    }
    return <>{props.children}</>
  } else {
    return <props.render />
  }
}
