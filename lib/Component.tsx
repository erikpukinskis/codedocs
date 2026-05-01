import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useEffect, useRef, useState } from "react"
import * as styles from "./Component.css"
import { ErrorBoundary } from "./ErrorBoundary"
import { EventLog, useEventLog } from "./EventLog"
import type { AllowedPropTypes, PropDefLookup } from "./helpers/componentTypes"

type ComponentProps<PropsType extends Record<string, AllowedPropTypes>> = {
  /**
   * A unique identifier for this component
   */
  name: string
  /**
   * The render function
   */
  component: React.FC<PropsType>
  /**
   * Prop definitions with values. For slot props, the value can be a SlotId
   * reference to another slot in the tree.
   */
  props: PropDefLookup<PropsType>
  /**
   * If true, renders a "skipped" placeholder instead of the component.
   */
  skip?: boolean
  /**
   * If true, only this component (and other `only`-marked elements) will be
   * shown on the page. Used for focused development.
   */
  only?: boolean
  /**
   * CSS selectors whose bounding boxes should be used to size the preview
   * area, accommodating overflow from positioned children.
   */
  boundingSelectors?: string[]
}

export function Component<PropsType extends Record<string, AllowedPropTypes>>({
  name: componentName,
  component: RenderFunction,
  props: initialProps,
  skip = false,
  boundingSelectors,
}: ComponentProps<PropsType>) {
  const [propValues, setPropValues] = useState(() =>
    Object.fromEntries(
      Object.entries(initialProps).map(([key, def]) => [key, def.value])
    )
  )

  const { events } = useEventLog()

  const resolvedProps = Object.fromEntries(
    Object.entries(initialProps).map(([key]) => [key, propValues[key]])
  ) as PropsType

  return (
    <div data-component="Component" className={styles.Component({ skip })}>
      <div className={styles.DemoContainer}>
        {skip ? (
          <>
            <FontAwesomeIcon
              icon="eye-slash"
              color="#ffa800"
              className={styles.outdentIcon}
            />
            This component has been skipped.
          </>
        ) : (
          <ErrorBoundary location="demo-area">
            <ComponentPreview boundingSelectors={boundingSelectors}>
              <RenderFunction {...resolvedProps} />
            </ComponentPreview>
          </ErrorBoundary>
        )}
        <EventLog events={events} />
      </div>
      <div className={styles.PropsPanel}>
        {Object.entries(initialProps).map(([propName, def]) => {
          if (def.type === "slot") return null

          return (
            <React.Fragment key={propName}>
              <label
                htmlFor={`prop-input-${componentName}-${propName}`}
                className={styles.PropLabel}
              >
                {propName}
              </label>
              <div>
                {def.type === "boolean" ? (
                  <input
                    id={`prop-input-${componentName}-${propName}`}
                    type="checkbox"
                    checked={Boolean(propValues[propName])}
                    onChange={(e) => {
                      setPropValues((prev) => ({
                        ...prev,
                        [propName]: e.target.checked,
                      }))
                    }}
                  />
                ) : def.type === "number" ? (
                  <input
                    id={`prop-input-${componentName}-${propName}`}
                    type="number"
                    value={Number(propValues[propName] ?? 0)}
                    onChange={(e) => {
                      setPropValues((prev) => ({
                        ...prev,
                        [propName]: e.target.valueAsNumber,
                      }))
                    }}
                  />
                ) : def.type === "string-union" ? (
                  <select
                    id={`prop-input-${componentName}-${propName}`}
                    value={String(propValues[propName] ?? "")}
                    onChange={(e) => {
                      setPropValues((prev) => ({
                        ...prev,
                        [propName]: e.target.value,
                      }))
                    }}
                  >
                    {def.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`prop-input-${componentName}-${propName}`}
                    type="text"
                    className={styles.PropInput}
                    value={String(propValues[propName] ?? "")}
                    onChange={(e) => {
                      setPropValues((prev) => ({
                        ...prev,
                        [propName]: e.target.value,
                      }))
                    }}
                  />
                )}
                {def.description && (
                  <div className={styles.PropDescription}>
                    {def.description}
                  </div>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

type ComponentPreviewProps = {
  boundingSelectors?: string[]
  children: React.ReactNode
}

/**
 * Wrapper for the live component render. When `boundingSelectors` is provided,
 * a MutationObserver expands the wrapper's padding to fully contain any
 * overflowing positioned children (popovers, tooltips, etc.) so crop marks
 * frame them correctly.
 */
const ComponentPreview: React.FC<ComponentPreviewProps> = ({
  boundingSelectors,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container || !boundingSelectors?.length) return

    const sync = () => {
      if (!container.isConnected) return
      const containerRect = container.getBoundingClientRect()
      let minX = 0
      let minY = 0
      let maxX = containerRect.width
      let maxY = containerRect.height

      for (const selector of boundingSelectors) {
        for (const el of Array.from(container.querySelectorAll(selector))) {
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
        maxX - containerRect.width
      )}px`
      container.style.paddingBottom = `${Math.max(
        0,
        maxY - containerRect.height
      )}px`
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [boundingSelectors])

  return <div ref={ref}>{children}</div>
}
