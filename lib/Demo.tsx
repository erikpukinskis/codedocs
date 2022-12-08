import { styled } from "@stitches/react"
import React from "react"
import { CodeEditor } from "./CodeEditor"

type HasChildren = {
  children: React.ReactElement | React.ReactText | React.ReactPortal
}

type Renderable = {
  render: React.FC<unknown>
}

type Generatable = {
  generate: () => JSX.Element
}

type DemoProps = (HasChildren | Renderable | Generatable) & {
  source?: string
}

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
  flexBasis: 1,
  flexGrow: 1,
})

const EditorContainer = styled("div", {
  borderRadius: 6,
  background: "#282A36",
  padding: 6,
  opacity: "90%",
  flexBasis: 1,
  flexGrow: 1,
  overflowX: "scroll",
})

export const Demo = (props: DemoProps) => {
  console.log(props)

  let demoArea: JSX.Element

  if (hasChildren(props)) {
    if (typeof props.children === "function") {
      throw new Error(
        `Don't pass function children to <Demo>, pass a render function like: <Demo render={() => ... } />`
      )
    }
    demoArea = <>{props.children}</>
  } else if (isRenderable(props)) {
    demoArea = <props.render />
  } else {
    demoArea = props.generate()
  }

  return (
    <DemoWithCode>
      <EditorContainer>
        <CodeEditor source={props.source} />
      </EditorContainer>
      <DemoContainer>{demoArea}</DemoContainer>
    </DemoWithCode>
  )
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
