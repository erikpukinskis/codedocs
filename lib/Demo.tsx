import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useEffect, useMemo, useRef } from "react"
import { CropMarks } from "./CropMarks"
import * as styles from "./Demo.css"
import { ErrorBoundary } from "./ErrorBoundary"
import { EventLog, useEventLog } from "./EventLog"

type ReactChildren = React.ReactElement | React.ReactPortal | string

type DemoPropsWithChildren = {
  children: ReactChildren | Array<ReactChildren>
  defaultValue?: never
}

type CallbackFactory = (name: string) => (...args: unknown[]) => void

export type PropsLike = Record<string, unknown>

export type DemoContext<
  ValueType,
  DependenciesType extends DependencyMap = DependencyMap,
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
  VariantsType extends string = never,
> = {
  render: React.FC<
    DemoContext<ValueType, DependenciesType> & { variant: VariantsType }
  >
  defaultValue?: ValueType
}

export type DemoProps<
  ValueType,
  DependenciesType extends DependencyMap = DependencyMap,
  VariantsType extends string = never,
> = (
  | DemoPropsWithChildren
  | DemoPropsWithRenderFunction<ValueType, DependenciesType, VariantsType>
) & {
  /**
   * Macro-only: when the doc uses `// @codedocs include-wrapper-in-source`, set
   * this to show only the demo's inner content in the extracted source (children
   * concatenation or the `render` body), not the full `<Demo>` element. Ignored
   * at runtime.
   */
  noWrapperInSource?: boolean
  width?: "full" | number
  skip?: boolean
  only?: boolean
  boundingSelectors?: string[]
  dependencies?: DependenciesType
  variants?: VariantsType[]
}

/**
 * Renders a code demo. The DOM is intentionally flat:
 *
 *   variantContent (grid)         — per-variant wrapper
 *     demoContent (row 1, col 1)  — wraps {children}, hosts the live render
 *     CropMarks   (absolute)      — overlay on the demo content cell
 *     EventLog    (absolute, transient overlay; uses its existing CSS)
 *
 * Source code IS NOT rendered here. The macro emits one Slate `code-block`
 * sibling per source/dependency in the document model, linked back to this
 * Demo's frozen block via `demoId`.
 *
 * Source tabs are also NOT rendered here. They are a facet of the editor:
 * FrozenBlockElement (in Editor.tsx) renders a DemoTabs row positioned at
 * the bottom-right of the frozenBlock (which is already position:relative).
 */
export function Demo<
  ValueType,
  DependenciesType extends DependencyMap,
  VariantsType extends string = never,
>(props: DemoProps<ValueType, DependenciesType, VariantsType>) {
  const { events, mockCallback } = useEventLog()
  const [value, setValue] = React.useState(props.defaultValue)

  const dependencies = (
    hasDependencies(props) ? props.dependencies : {}
  ) as DependenciesType

  const demoContext = useMemo<DemoContext<ValueType, DependenciesType>>(
    () => ({
      value,
      setValue,
      mock: {
        callback: mockCallback,
      },
      ...dependencies,
    }),
    [value, dependencies, mockCallback],
  )

  if (props.skip) {
    return <SkippedDemo />
  }

  const variantsToRender =
    props.variants && props.variants.length > 0
      ? props.variants
      : [undefined as never]

  const isFullWidth = props.width === "full"

  return (
    <>
      {variantsToRender.map((variant) => {
        const content = hasChildren(props) ? (
          props.children
        ) : isRenderable(props) ? (
          <props.render {...demoContext} variant={variant} />
        ) : null

        if (content === null) {
          throw new Error("not sure what type of demo this is")
        }

        return (
          <div
            key={variant ?? "__default"}
            className={styles.variantContent({
              fullWidth: isFullWidth,
            })}
            style={{
              width: typeof props.width === "number" ? props.width : undefined,
            }}
            data-component="Demo"
          >
            <DemoContent boundingSelectors={props.boundingSelectors}>
              <ErrorBoundary location="demo-area">{content}</ErrorBoundary>
            </DemoContent>
            <div className={styles.cropMarks}>
              <CropMarks />
            </div>
            <EventLog events={events} />
          </div>
        )
      })}
    </>
  )
}

type DemoContentProps = {
  boundingSelectors?: string[]
  children: React.ReactNode
}

/**
 * Wraps the live demo render and applies the `boundingSelectors` padding. When
 * children matching the selectors overflow visually, this expands its own
 * padding so crop marks frame them properly.
 */
const DemoContent: React.FC<DemoContentProps> = ({
  boundingSelectors,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container || !boundingSelectors?.length) return

    const sync = () => {
      const selectors = boundingSelectors
      if (!container.isConnected) return
      const containerRect = container.getBoundingClientRect()
      let minX = 0
      let minY = 0
      let maxX = containerRect.width
      let maxY = containerRect.height

      for (const selector of selectors) {
        const els = Array.from(container.querySelectorAll(selector))
        for (const el of els) {
          const r = el.getBoundingClientRect()
          minX = Math.min(minX, r.left - containerRect.left)
          minY = Math.min(minY, r.top - containerRect.top)
          maxX = Math.max(maxX, r.right - containerRect.left)
          maxY = Math.max(maxY, r.bottom - containerRect.top)
        }
      }

      container.style.paddingLeft = `${Math.abs(Math.min(0, minX))}px`
      container.style.paddingTop = `${Math.abs(Math.min(0, minY))}px`
      container.style.paddingRight = `${Math.max(
        0,
        maxX - containerRect.width,
      )}px`
      container.style.paddingBottom = `${Math.max(
        0,
        maxY - containerRect.height,
      )}px`
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [boundingSelectors])

  return (
    <div ref={ref} className={styles.demoContent}>
      {children}
    </div>
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

function hasChildren<
  ValueType,
  DependenciesType extends DependencyMap,
  VariantsType extends string,
>(
  demoProps: DemoProps<ValueType, DependenciesType, VariantsType>,
): demoProps is DemoProps<ValueType, DependenciesType, VariantsType> &
  DemoPropsWithChildren {
  return Object.prototype.hasOwnProperty.call(demoProps, "children")
}

function hasDependencies<
  ValueType,
  DependenciesType extends DependencyMap,
  VariantsType extends string,
>(
  demoProps: DemoProps<ValueType, DependenciesType, VariantsType>,
): demoProps is DemoProps<ValueType, DependenciesType, VariantsType> &
  DemoPropsWithRenderFunction<ValueType, DependenciesType, VariantsType> {
  return Object.prototype.hasOwnProperty.call(demoProps, "dependencies")
}

function isRenderable<
  ValueType,
  DependenciesType extends DependencyMap,
  VariantsType extends string,
>(
  demoProps: DemoProps<ValueType, DependenciesType, VariantsType>,
): demoProps is DemoProps<ValueType, DependenciesType, VariantsType> &
  DemoPropsWithRenderFunction<ValueType, DependenciesType, VariantsType> {
  return (
    Object.prototype.hasOwnProperty.call(demoProps, "render") &&
    !Object.prototype.hasOwnProperty.call(demoProps, "props")
  )
}
