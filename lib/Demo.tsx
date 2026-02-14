import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useLayoutEffect, useMemo, useRef, useState } from "react"
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
}

type CallbackFactory = (name: string) => (...args: unknown[]) => void

export type PropsLike = Record<string, unknown>

export type DemoContext<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ValueType,
  DependenciesType extends DependencyMap = DependencyMap
> = {
  value: ValueType | undefined
  setValue: (value: ValueType | undefined) => void
  mock: {
    callback: CallbackFactory
  }
} & DependenciesType

export type DependencyMap = Record<string, unknown>

type DemoPropsWithRenderFunction<
  ValueType = unknown,
  DependenciesType extends DependencyMap = DependencyMap,
  VariantsType extends string = never
> = {
  render: React.FC<
    DemoContext<ValueType, DependenciesType> & { variant: VariantsType }
  >
  defaultValue?: ValueType
}

export type DemoProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ValueType,
  DependenciesType extends DependencyMap = DependencyMap,
  VariantsType extends string = never
> = (
  | DemoPropsWithChildren
  | DemoPropsWithRenderFunction<ValueType, DependenciesType, VariantsType>
) & {
  source?: string
  inline?: boolean
  skip?: boolean
  only?: boolean
  boundingSelectors?: string[]
  dependencies?: DependenciesType
  dependencySources?: Record<string, string>
  noWrapperInSource?: boolean
  width?: number
  variants?: VariantsType[]
}

export function Demo<
  ValueType,
  DependenciesType extends DependencyMap,
  VariantsType extends string = never
>(props: DemoProps<ValueType, DependenciesType, VariantsType>) {
  const [activeTab, setActiveTab] = useState<string>("__source")
  const [showCode, setShowCode] = useState(false)
  const [events, setEvents] = useState<CallbackEvent[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [value, setValue] = useState(props.defaultValue)

  const dependencySources = hasDependencies(props)
    ? props.dependencySources
    : undefined
  const dependencyNames = dependencySources
    ? Object.keys(dependencySources)
    : []

  const formattedSource = (() => {
    if (!showCode) return null

    const source =
      activeTab === "__source" ? props.source : dependencySources?.[activeTab]

    if (!source) return NO_MACRO_ERROR

    return source
  })()

  const dependencies = (
    hasDependencies(props) ? props.dependencies : {}
  ) as DependenciesType

  // Create the context object to pass to render functions
  const demoContext = useMemo<DemoContext<ValueType, DependenciesType>>(
    () => ({
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
      ...dependencies,
    }),
    [value, dependencies]
  )

  const { inline = false, variants } = props

  const variantsToRender =
    variants && variants.length > 0 ? variants : [undefined as never]

  return (
    <>
      {variantsToRender.map((variant, i) => (
        <div
          key={variant}
          ref={containerRef}
          className={styles.demoWithCode}
          data-component="DemoWithCode"
          style={{ width: props.width }}
        >
          <div
            className={styles.demoContainer({
              inline,
              hasPadding: i === variantsToRender.length - 1,
            })}
            data-component="DemoContainer"
          >
            {props.skip ? (
              <SkippedDemo />
            ) : (
              <ErrorBoundary location="demo-area">
                <DemoArea
                  variant={variant}
                  inline={inline}
                  props={props}
                  context={demoContext}
                  boundingSelectors={props.boundingSelectors}
                />
              </ErrorBoundary>
            )}

            {i === variantsToRender.length - 1 && (
              <div className={styles.tabsContainer}>
                <div className={styles.tabs}>
                  <button
                    className={styles.tab({
                      active: showCode && activeTab === "__source",
                    })}
                    onClick={() => {
                      if (showCode && activeTab === "__source") {
                        setShowCode(false)
                      } else {
                        setActiveTab("__source")
                        setShowCode(true)
                      }
                    }}
                  >
                    Source
                  </button>
                  {dependencyNames.map((name) => (
                    <button
                      key={name}
                      className={styles.tab({
                        active: showCode && activeTab === name,
                      })}
                      onClick={() => {
                        if (showCode && activeTab === name) {
                          setShowCode(false)
                        } else {
                          setActiveTab(name)
                          setShowCode(true)
                        }
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <EventLog events={events} />
          </div>

          {formattedSource && i === variantsToRender.length - 1 && (
            <Code
              // Set this key to force re-mount (stat reset) when we switch files:
              key={activeTab}
              source={formattedSource}
              mode="tsx"
              onClickClose={() => setShowCode(false)}
            />
          )}
        </div>
      ))}
    </>
  )
}

const SkippedDemo: React.FC = () => {
  return (
    <div data-component="SkippedDemo" className={styles.skippedDemo}>
      <FontAwesomeIcon
        icon="eye-slash"
        color="#ffa800"
        className={styles.outdentIcon}
      />
      This demo has been skipped.
    </div>
  )
}

type DemoAreaProps<
  ValueType,
  DependenciesType extends DependencyMap,
  VariantsType extends string
> = {
  props: DemoProps<ValueType, DependenciesType, VariantsType>
  context: DemoContext<ValueType, DependenciesType>
  boundingSelectors?: string[]
  inline: boolean
  variant: VariantsType
}

function DemoArea<
  ValueType,
  DependenciesType extends DependencyMap,
  VariantsType extends string
>({
  props,
  context,
  boundingSelectors,
  inline,
  variant,
}: DemoAreaProps<ValueType, DependenciesType, VariantsType>) {
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
    <props.render {...context} variant={variant} />
  ) : null

  if (!content) {
    throw new Error("not sure what type of demo this is")
  }

  return (
    <div
      ref={areaRef}
      style={{
        display: "inline-block",
        width: inline ? "auto" : "100%",
        maxWidth: "100%",
      }}
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

function hasChildren<
  ValueType,
  DependenciesType extends DependencyMap,
  VariantsType extends string
>(
  demoProps: DemoProps<ValueType, DependenciesType, VariantsType>
): demoProps is DemoProps<ValueType, DependenciesType, VariantsType> &
  DemoPropsWithChildren {
  return Object.prototype.hasOwnProperty.call(demoProps, "children")
}

function hasDependencies<
  ValueType,
  DependenciesType extends DependencyMap,
  VariantsType extends string
>(
  demoProps: DemoProps<ValueType, DependenciesType, VariantsType>
): demoProps is DemoProps<ValueType, DependenciesType, VariantsType> &
  DemoPropsWithRenderFunction<ValueType, DependenciesType, VariantsType> {
  return Object.prototype.hasOwnProperty.call(demoProps, "dependencies")
}

function isRenderable<
  ValueType,
  DependenciesType extends DependencyMap,
  VariantsType extends string
>(
  demoProps: DemoProps<ValueType, DependenciesType, VariantsType>
): demoProps is DemoProps<ValueType, DependenciesType, VariantsType> &
  DemoPropsWithRenderFunction<ValueType, DependenciesType, VariantsType> {
  return (
    Object.prototype.hasOwnProperty.call(demoProps, "render") &&
    !Object.prototype.hasOwnProperty.call(demoProps, "props")
  )
}

const NO_MACRO_ERROR = `// Source code unavailable
// try installing babel-plugin-macros or vite-plugin-babel-macros and using:
// import { Demo } from "codedocs/macro"`
