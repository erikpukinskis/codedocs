import { styled } from "@stitches/react"
import prettier from "prettier"
import parserTypescript from "prettier/parser-typescript"
import React, { useEffect, useState } from "react"
import { Code } from "./Code"

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

const CodeColumn = styled(Code, {
  flexBasis: "60%",
  flexGrow: 1,
  overflowX: "scroll",
})

const NO_MACRO_ERROR = `// Source code unavailable
// try installing babel-plugin-macros or vite-plugin-babel-macros and using:
// import { Demo } from "codedocs/macro"`

export const Demo = (props: DemoProps) => {
  const [formatted, setFormatted] = useState("")

  useEffect(() => {
    if (props.source) {
      setFormatted(formatTypescript(props.source))
    } else {
      setFormatted(NO_MACRO_ERROR)
    }
  }, [props.source])

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
      <CodeColumn source={formatted} mode="tsx" />
      <DemoContainer>{demoArea}</DemoContainer>
    </DemoWithCode>
  )
}

function formatTypescript(source: string) {
  return prettier
    .format(source, {
      parser: "typescript",
      plugins: [parserTypescript],
      printWidth: 55,
      semi: false,
    })
    .replace(/^;/, "")
}
