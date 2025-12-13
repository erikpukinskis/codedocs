import prettier from "prettier"
import parserTypescript from "prettier/parser-typescript"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Code } from "./Code"
import * as styles from "./Demo.css"
import { EventLog, type CallbackEvent } from "./EventLog"

type ReactChildren =
  | React.ReactElement
  | React.ReactText
  | React.ReactPortal
  | string

type DemoPropsWithChildren = {
  children: ReactChildren | Array<ReactChildren>
  defaultValue?: never
  only?: boolean
  skip?: boolean
}

type CallbackFactory = (name: string) => (...args: unknown[]) => void

export type PropsLike = Record<string, unknown>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DemoContext<T = any> = {
  value: T
  setValue: (value: T) => void
  mock: {
    callback: CallbackFactory
  }
}

type DemoPropsWithRenderFunction<T = unknown> = {
  render: React.FC<DemoContext<T>>
  defaultValue?: T
  only?: boolean
  skip?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DemoProps<T = any> = (
  | DemoPropsWithChildren
  | DemoPropsWithRenderFunction<T>
) & {
  source?: string
  inline?: boolean
}

export function Demo<T>(props: DemoProps<T>) {
  const [formatted, setFormatted] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [events, setEvents] = useState<CallbackEvent[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [value, setValue] = useState(props.defaultValue)

  useEffect(() => {
    if (props.source) {
      setFormatted(formatTypescript(props.source))
    } else {
      setFormatted(NO_MACRO_ERROR)
    }
  }, [props.source])

  // Create the context object to pass to render functions
  const demoContext = useMemo<DemoContext>(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      value,
      setValue,
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
    }),
    [value]
  )

  let demoArea: JSX.Element

  if (hasChildren(props)) {
    demoArea = <>{props.children}</>
  } else if (isRenderable(props)) {
    demoArea = <props.render {...demoContext} />
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

        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              className={styles.tab({ active: showCode })}
              onClick={() => setShowCode(!showCode)}
            >
              Source
            </button>
          </div>
        </div>
        <EventLog events={events} />
      </div>

      {showCode && <Code source={formatted} mode="tsx" />}
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

function hasChildren(demoProps: DemoProps): demoProps is DemoPropsWithChildren {
  return Object.prototype.hasOwnProperty.call(demoProps, "children")
}

function isRenderable(
  demoProps: DemoProps
): demoProps is DemoPropsWithRenderFunction {
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
    .trim()
}
