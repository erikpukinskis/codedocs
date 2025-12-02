import prettier from "prettier"
import parserTypescript from "prettier/parser-typescript"
import React, { useEffect, useRef, useState } from "react"
import * as styles from "./Demo.css"

type ReactChildren =
  | React.ReactElement
  | React.ReactText
  | React.ReactPortal
  | string

type HasChildren = {
  children: ReactChildren | Array<ReactChildren>
  only?: boolean
  skip?: boolean
}

export type PropsLike = Record<string, unknown>

type RenderableNoProps = {
  render: React.FC
  only?: boolean
  skip?: boolean
}

export type DemoProps = (HasChildren | RenderableNoProps) & {
  source?: string
  inline?: boolean
}

export function Demo(props: DemoProps) {
  const [formatted, setFormatted] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (props.source) {
      setFormatted(formatTypescript(props.source))
    } else {
      setFormatted(NO_MACRO_ERROR)
    }
  }, [props.source])

  let demoArea: JSX.Element

  if (hasChildren(props)) {
    demoArea = <>{props.children}</>
  } else if (isRenderable(props)) {
    demoArea = <props.render />
  } else {
    throw new Error("not sure what type of demo this is")
  }

  if (!formatted) return null

  const { inline = false } = props

  return (
    <div
      ref={containerRef}
      className={styles.demoWithCode}
      data-component="DemoWithCode"
    >
      {/* <CodeColumn source={formatted} mode="tsx" /> */}
      <div
        className={styles.demoContainer({ inline })}
        data-component="DemoContainer"
      >
        {demoArea}
        <HorizontalMark top left />
        <HorizontalMark bottom left />
        <HorizontalMark top right />
        <HorizontalMark bottom right />

        <VerticalMark top left />
        <VerticalMark bottom left />
        <VerticalMark top right />
        <VerticalMark bottom right />
      </div>
    </div>
  )
}

type CropMarksProps = {
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
}

const MARK_LENGTH = 6
const MARK_OFFSET = 3

const HorizontalMark: React.FC<CropMarksProps> = ({ top, left }) => {
  const style: React.CSSProperties = {
    width: MARK_LENGTH,
  }

  if (left) {
    style.left = -1 * MARK_LENGTH - MARK_OFFSET
  } else {
    style.right = -1 * MARK_LENGTH - MARK_OFFSET
  }

  if (top) {
    style.top = 0
  } else {
    style.bottom = 0
  }

  return (
    <div
      className={styles.cropMark}
      data-component="CropMark"
      style={style}
    ></div>
  )
}

const VerticalMark: React.FC<CropMarksProps> = ({ top, left }) => {
  const style: React.CSSProperties = {
    height: MARK_LENGTH,
  }

  if (left) {
    style.left = 0
  } else {
    style.right = 0
  }

  if (top) {
    style.top = -1 * MARK_LENGTH - MARK_OFFSET
  } else {
    style.bottom = -1 * MARK_LENGTH - MARK_OFFSET
  }

  return <div className={styles.cropMark} style={style}></div>
}

function hasChildren(demoProps: DemoProps): demoProps is HasChildren {
  return Object.prototype.hasOwnProperty.call(demoProps, "children")
}

function isRenderable(demoProps: DemoProps): demoProps is RenderableNoProps {
  return (
    Object.prototype.hasOwnProperty.call(demoProps, "render") &&
    !Object.prototype.hasOwnProperty.call(demoProps, "props")
  )
}

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
