import { styled } from "@stitches/react"
import prettier from "prettier"
import parserTypescript from "prettier/parser-typescript"
import React, { useEffect, useState } from "react"
import { CodeEditor } from "./CodeEditor"

type HasChildren = {
  children: React.ReactElement | React.ReactText | React.ReactPortal
}

type Renderable = {
  render: React.FC<unknown>
}

type DemoProps = (HasChildren | Renderable) & {
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
  flexBasis: "40%",
  flexGrow: 1,
})

const EditorContainer = styled("div", {
  borderRadius: 6,
  background: "#282A36",
  padding: 6,
  opacity: "90%",
  flexBasis: "60%",
  flexGrow: 1,
  overflowX: "scroll",
})

export const Demo = (props: DemoProps) => {
  const [formatted, setFormatted] = useState("")

  useEffect(() => {
    if (props.source) {
      setFormatted(formatTypescript(props.source))
    } else {
      setFormatted(
        '// import { Demo } from "codedocs/macro" to enable source code'
      )
    }
  }, [props.source])

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
    throw new Error("not sure what type fo demo this is")
  }

  if (!formatted) return null

  return (
    <DemoWithCode>
      <EditorContainer>
        <CodeEditor source={formatted} />
      </EditorContainer>
      <DemoContainer>{demoArea}</DemoContainer>
    </DemoWithCode>
  )
}

function formatTypescript(source: string) {
  return prettier
    .format(source, {
      parser: "typescript",
      plugins: [parserTypescript],
      printWidth: 60,
    })
    .replace(/[\r\n]+$/, "")
}
