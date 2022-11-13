import React from "react"

type HasChildren = {
  children: React.ReactElement | React.ReactText | React.ReactPortal
}

type Renderable = {
  render: React.FC<unknown>
}

type Generatable = {
  generate: () => JSX.Element
}

type DemoProps = HasChildren | Renderable | Generatable

function hasChildren(props: DemoProps): props is HasChildren {
  return Boolean((props as HasChildren).children)
}

function isRenderable(props: DemoProps): props is Renderable {
  return Boolean((props as Renderable).render)
}

export const Demo = (props: DemoProps) => {
  if (hasChildren(props)) {
    if (typeof props.children === "function") {
      throw new Error(
        `Don't pass function children to <Demo>, pass a render function like: <Demo render={() => ... } />`
      )
    }
    return <>{props.children}</>
  } else if (isRenderable(props)) {
    return <props.render />
  } else {
    return props.generate()
  }
}
