import * as styles from "./Component.css"
import type { AllowedPropTypes, PropDefLookup } from "./helpers/componentTypes"
import { getPropValues } from "./PaletteProvider"

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
}

export function Component<PropsType extends Record<string, AllowedPropTypes>>({
  name: componentName,
  component: RenderFunction,
  props,
}: ComponentProps<PropsType>) {
  return (
    <div data-component="Component" className={styles.Component}>
      <div className={styles.DemoContainer}>
        {/* <div className={styles.ComponentTitle}>{componentName}</div> */}
        <RenderFunction {...getPropValues(props)} />
      </div>
      <div className={styles.PropsPanel}>
        {Object.entries(props).map(
          ([propName, { type, value, description }]) => (
            <>
              <label
                key={propName}
                htmlFor={`prop-input-${componentName}-${propName}`}
                className={styles.PropLabel}
              >
                {propName}
              </label>
              <div>
                <input
                  type="text"
                  className={styles.PropInput}
                  value={value}
                  onChange={(e) => {}}
                />
                {description && (
                  <div className={styles.PropDescription}>{description}</div>
                )}
              </div>
            </>
          )
        )}
      </div>
    </div>
  )
}
