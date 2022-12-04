import React from "react"
import { styled } from "@stitches/react"
import { CodeEditor } from "./CodeEditor"

type HasChildren = {
  children: React.ReactElement | React.ReactText | React.ReactPortal
}

type Renderable = {
  render: React.FC<unknown>
  source: string
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

const DemoWithCode = styled("div", {
  display: "flex",
  flexDirection: "row",
  gap: 16,
})

const DemoContainer = styled("div", {
  display: "flex",
  flexDirection: "row",
  gap: 16,
  flexGrow: 1,
})

export const Demo = (props: DemoProps) => {
  if (hasChildren(props)) {
    if (typeof props.children === "function") {
      throw new Error(
        `Don't pass function children to <Demo>, pass a render function like: <Demo render={() => ... } />`
      )
    }
    return <>{props.children}</>
  } else if (isRenderable(props)) {
    return (
      <DemoWithCode>
        <DemoContainer>
          <props.render />
        </DemoContainer>
        <CodeEditor source={props.source} />
      </DemoWithCode>
    )
  } else {
    return props.generate()
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
const formatCode = (func: Function) => {
  const lines = func.toString().split("\n")
  const withoutClosure = lines.slice(1, lines.length - 2)
  const depth = Math.min(...withoutClosure.map(toDepth))
  const withoutLeadingWhitespace = lines.map((line) => line.slice(depth))

  return withoutLeadingWhitespace.join("\n")
}

const toDepth = (line: string) => {
  const spaceMatch = line.match(/^( *)/)
  if (!spaceMatch) return 0
  return spaceMatch[1].length
}
