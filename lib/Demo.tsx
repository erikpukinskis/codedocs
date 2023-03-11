import { styled } from "@stitches/react"
import prettier from "prettier"
import parserTypescript from "prettier/parser-typescript"
import React, { useEffect, useState } from "react"
import { Code } from "./Code"

type HasChildren = {
  children: React.ReactElement | React.ReactText | React.ReactPortal
}

export type PropsLike = Record<string, unknown>

type RenderableWithProps<RenderProps extends PropsLike> = {
  render: React.FC<RenderProps>
  props: RenderProps
}

type RenderableNoProps = {
  render: React.FC<{}>
}

export type DemoProps<RenderProps extends PropsLike> = (
  | HasChildren
  | RenderableNoProps
  | RenderableWithProps<RenderProps>
) & {
  source?: string
}

export function Demo<RenderProps extends PropsLike>(
  props: DemoProps<RenderProps>
) {
  const [formatted, setFormatted] = useState("")

  console.log("durd")
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
  } else if (isRenderableWithProps(props)) {
    demoArea = <props.render {...props.props} />
  } else if (isRenderableNoProps(props)) {
    demoArea = <props.render />
  } else {
    throw new Error("not sure what type of demo this is")
  }

  if (!formatted) return null

  return (
    <DemoWithCode>
      {/* <CodeColumn source={formatted} mode="tsx" /> */}
      <DemoContainer>{demoArea}</DemoContainer>
    </DemoWithCode>
  )
}

function hasChildren<RenderProps extends PropsLike>(
  demoProps: DemoProps<RenderProps>
): demoProps is HasChildren {
  return Object.prototype.hasOwnProperty.call(demoProps, "children")
}

function isRenderableWithProps<RenderProps extends PropsLike>(
  demoProps: DemoProps<RenderProps>
): demoProps is RenderableWithProps<RenderProps> {
  return (
    Object.prototype.hasOwnProperty.call(demoProps, "render") &&
    Object.prototype.hasOwnProperty.call(demoProps, "props")
  )
}

function isRenderableNoProps<RenderProps extends PropsLike>(
  demoProps: DemoProps<RenderProps>
): demoProps is RenderableNoProps {
  return (
    Object.prototype.hasOwnProperty.call(demoProps, "render") &&
    !Object.prototype.hasOwnProperty.call(demoProps, "props")
  )
}

const DemoWithCode = styled("div", {
  display: "flex",
  flexDirection: "row",
  gap: 16,
  boxShadow: "inset 0 1px 6px 1px rgb(0 0 0 / 10%)",
  padding: 16,
  borderRadius: 8,
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
