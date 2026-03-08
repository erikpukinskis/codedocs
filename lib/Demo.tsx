import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useMemo, useState } from "react"
import { Code } from "./Code"
import * as styles from "./Demo.css"
import { ErrorBoundary } from "./ErrorBoundary"
import { EventLog, useEventLog } from "./EventLog"
import { PreviewArea } from "./PreviewArea"

type ReactChildren = React.ReactElement | React.ReactPortal | string

type DemoPropsWithChildren = {
  children: ReactChildren | Array<ReactChildren>
  defaultValue?: never
}

type CallbackFactory = (name: string) => (...args: unknown[]) => void

export type PropsLike = Record<string, unknown>

export type DemoContext<
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
  ValueType,
  DependenciesType extends DependencyMap = DependencyMap,
  VariantsType extends string = never
> = (
  | DemoPropsWithChildren
  | DemoPropsWithRenderFunction<ValueType, DependenciesType, VariantsType>
) & {
  source?: string
  width?: "full" | number
  skip?: boolean
  only?: boolean
  boundingSelectors?: string[]
  dependencies?: DependenciesType
  dependencySources?: Record<string, string>
  noWrapperInSource?: boolean
  variants?: VariantsType[]
}

export function Demo<
  ValueType,
  DependenciesType extends DependencyMap,
  VariantsType extends string = never
>(props: DemoProps<ValueType, DependenciesType, VariantsType>) {
  const [activeTab, setActiveTab] = useState<string>("__source")
  const [showCode, setShowCode] = useState(false)
  const { events, mockCallback } = useEventLog()
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
        callback: mockCallback,
      },
      ...dependencies,
    }),
    [value, dependencies, mockCallback]
  )

  const { width, variants } = props

  if (props.skip) {
    return (
      <div className={styles.demo} data-component="Demo">
        <SkippedDemo />
      </div>
    )
  }

  const variantsToRender =
    variants && variants.length > 0 ? variants : [undefined as never]

  return (
    <>
      {variantsToRender.map((variant, i) => (
        <div
          key={variant ?? "__default"}
          className={styles.demo}
          data-component="Demo"
          style={{ width: props.width }}
        >
          <div
            className={styles.demoContainer({
              inline: !width,
              hasPadding: i === variantsToRender.length - 1,
            })}
            data-component="DemoContainer"
          >
            <ErrorBoundary location="demo-area">
              <DemoArea
                variant={variant}
                inline={!width}
                props={props}
                context={demoContext}
                boundingSelectors={props.boundingSelectors}
              />
            </ErrorBoundary>

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

export const SkippedDemo: React.FC = () => {
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
  const content = hasChildren(props) ? (
    props.children
  ) : isRenderable(props) ? (
    <props.render {...context} variant={variant} />
  ) : null

  if (!content) {
    throw new Error("not sure what type of demo this is")
  }

  return (
    <PreviewArea boundingSelectors={boundingSelectors} inline={inline}>
      {content}
    </PreviewArea>
  )
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
