import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useState } from "react"
import * as styles from "./Component.css"
import { ErrorBoundary } from "./ErrorBoundary"
import { EventLog, useEventLog } from "./EventLog"
import type { AllowedPropTypes, PropDefLookup } from "./helpers/componentTypes"
import { PreviewArea } from "./PreviewArea"

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
  skip,
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
    <div data-component="Component" className={styles.Component}>
      <div className={styles.DemoContainer}>
        {skip ? (
          <SkippedComponent />
        ) : (
          <ErrorBoundary location="demo-area">
            <PreviewArea boundingSelectors={boundingSelectors}>
              <RenderFunction {...resolvedProps} />
            </PreviewArea>
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

const SkippedComponent: React.FC = () => {
  return (
    <div data-component="SkippedComponent" className={styles.skippedComponent}>
      <FontAwesomeIcon
        icon="eye-slash"
        color="#ffa800"
        className={styles.outdentIcon}
      />
      This component has been skipped.
    </div>
  )
}
