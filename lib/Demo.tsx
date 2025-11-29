import { styled } from "@stitches/react"
import prettier from "prettier"
import parserTypescript from "prettier/parser-typescript"
import React, { useEffect, useRef, useState } from "react"
import { EventLog, type CallbackEvent } from "./EventLog"

type HasChildren = {
  children: React.ReactElement | React.ReactText | React.ReactPortal
  only?: boolean
  skip?: boolean
}

type CallbackFactory = (name: string) => (...args: unknown[]) => void

export type PropsLike = Record<string, unknown>

export type DemoContext = {
  mock: {
    callback: CallbackFactory
  }
}

type RenderableWithProps<RenderProps extends PropsLike> = {
  render: React.FC<RenderProps & DemoContext>
  props: RenderProps
  only?: boolean
  skip?: boolean
}

type RenderableNoProps = {
  render: React.FC<DemoContext>
  only?: boolean
  skip?: boolean
}

export type DemoProps<RenderProps extends PropsLike> = (
  | HasChildren
  | RenderableNoProps
  | RenderableWithProps<RenderProps>
) & {
  source?: string
  inline?: boolean
}

export function Demo<RenderProps extends PropsLike>(
  props: DemoProps<RenderProps>
) {
  const [formatted, setFormatted] = useState("")
  const [events, setEvents] = useState<CallbackEvent[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (props.source) {
      setFormatted(formatTypescript(props.source))
    } else {
      setFormatted(NO_MACRO_ERROR)
    }
  }, [props.source])

  // Create the context object to pass to render functions
  const demoContext: DemoContext = {
    mock: {
      callback: (name: string) => {
        return (...args: unknown[]) => {
          const event: CallbackEvent = {
            id: Math.random().toString(36).slice(2, 10),
            name,
            args,
            time: Date.now().valueOf(),
          }
          setEvents((prev) => [event, ...prev])
        }
      },
    },
  }

  let demoArea: JSX.Element

  if (hasChildren(props)) {
    demoArea = <>{props.children}</>
  } else if (isRenderableWithProps(props)) {
    demoArea = <props.render {...props.props} {...demoContext} />
  } else if (isRenderableNoProps(props)) {
    demoArea = <props.render {...demoContext} />
  } else {
    throw new Error("not sure what type of demo this is")
  }

  if (!formatted) return null

  const { inline = false } = props

  return (
    <DemoWithCode ref={containerRef} data-component="DemoWithCode">
      {/* <CodeColumn source={formatted} mode="tsx" /> */}
      <DemoContainer inline={inline} data-component="DemoContainer">
        {demoArea}
        <HorizontalMark top left />
        <HorizontalMark bottom left />
        <HorizontalMark top right />
        <HorizontalMark bottom right />

        <VerticalMark top left />
        <VerticalMark bottom left />
        <VerticalMark top right />
        <VerticalMark bottom right />
      </DemoContainer>

      <EventLog events={events} />
    </DemoWithCode>
  )
}

const CropMark = styled("div", {
  background: "rgba(0,0,0,0.25)",
  width: 1,
  height: 1,
  position: "absolute",
})

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

  return <CropMark data-component="CropMark" style={style}></CropMark>
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

  return <CropMark style={style}></CropMark>
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

const DemoWithCode = styled("div", {})

const DemoContainer = styled("div", {
  position: "relative",
  variants: {
    inline: {
      true: {
        display: "inline-block",
      },
      false: {
        width: "100%",
      },
    },
  },
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
