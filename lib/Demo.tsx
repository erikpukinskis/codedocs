import prettier from "prettier"
import parserTypescript from "prettier/parser-typescript"
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Code } from "./Code"
import * as styles from "./Demo.css"
import { ErrorBoundary } from "./ErrorBoundary"
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
  boundingSelectors?: string[]
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
  boundingSelectors?: string[]
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
        <ErrorBoundary location="demo-area">
          <DemoArea
            inline={inline}
            props={props}
            context={demoContext}
            boundingSelectors={props.boundingSelectors}
          />
        </ErrorBoundary>

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

      {showCode && (
        <Code
          source={formatted}
          mode="tsx"
          onClickClose={() => setShowCode(false)}
        />
      )}
    </div>
  )
}

type DemoAreaProps = {
  props: DemoProps
  context: DemoContext
  boundingSelectors?: string[]
  inline: boolean
}

const DemoArea: React.FC<DemoAreaProps> = ({
  props,
  context,
  boundingSelectors,
  inline,
}: DemoAreaProps) => {
  const areaRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!areaRef.current || !boundingSelectors?.length) return

    const container = areaRef.current
    const containerRect = container.getBoundingClientRect()

    let minX = 0
    let minY = 0
    let maxX = containerRect.width
    let maxY = containerRect.height

    for (const selector of boundingSelectors) {
      const elements = Array.from(container.querySelectorAll(selector))
      for (const el of elements) {
        const rect = el.getBoundingClientRect()
        minX = Math.min(minX, rect.left - containerRect.left)
        minY = Math.min(minY, rect.top - containerRect.top)
        maxX = Math.max(maxX, rect.right - containerRect.left)
        maxY = Math.max(maxY, rect.bottom - containerRect.top)
      }
    }

    // Apply padding to accommodate overflow
    const paddingLeft = Math.abs(Math.min(0, minX))
    const paddingTop = Math.abs(Math.min(0, minY))
    const paddingRight = Math.max(0, maxX - containerRect.width)
    const paddingBottom = Math.max(0, maxY - containerRect.height)

    container.style.paddingLeft = `${paddingLeft}px`
    container.style.paddingTop = `${paddingTop}px`
    container.style.paddingRight = `${paddingRight}px`
    container.style.paddingBottom = `${paddingBottom}px`
  }, [boundingSelectors])

  const ticks = (
    <>
      <HorizontalMark top left />
      <HorizontalMark bottom left />
      <HorizontalMark top right />
      <HorizontalMark bottom right />

      <VerticalMark top left />
      <VerticalMark bottom left />
      <VerticalMark top right />
      <VerticalMark bottom right />
    </>
  )

  const content = hasChildren(props) ? (
    props.children
  ) : isRenderable(props) ? (
    <props.render {...context} />
  ) : null

  if (!content) {
    throw new Error("not sure what type of demo this is")
  }

  return (
    <div
      ref={areaRef}
      style={{ display: "inline-block", width: inline ? "auto" : "100%" }}
    >
      <div style={{ position: "relative" }}>
        {content}
        {ticks}
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
