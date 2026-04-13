import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useRef } from "react"
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc, Placeholder } from "../../macro"
import { Button } from "./Button"
import { Toolbar } from "./Toolbar"
import * as styles from "./Toolbar.css"

export const ToolbarDocs = (
  <Doc path="/Components/Toolbar">
    <h2>Toolbar</h2>
    <Demo
      boundingSelectors={["#toolbar-doc-demo"]}
      render={() => {
        const rootRef = useRef<HTMLDivElement>(null)
        const ref = useRef<HTMLDivElement>(null)

        return (
          <div
            id="toolbar-doc-demo"
            ref={rootRef}
            className={styles.toolbarPositionRoot}
            style={{ minHeight: 120 }}
          >
            <Toolbar
              listenerAreaRef={rootRef}
              target={ref.current}
              open
              content={
                <>
                  <Button variant="borderless">
                    <FontAwesomeIcon icon="bold" />
                  </Button>
                  <Button variant="borderless">
                    <FontAwesomeIcon icon="italic" />
                  </Button>
                  <Button variant="borderless">
                    <FontAwesomeIcon icon="underline" />
                  </Button>
                </>
              }
            />
            <Placeholder ref={ref}>Target element</Placeholder>
          </div>
        )
      }}
    />
  </Doc>
)
