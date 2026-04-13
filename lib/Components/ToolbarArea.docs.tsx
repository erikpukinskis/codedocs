import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useRef } from "react"
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc, Placeholder } from "../../macro"
import { Button } from "./Button"
import { ToolbarArea } from "../Editor/Toolbar/ToolbarArea"

export const ToolbarAreaDocs = (
  <Doc path="/Components/Toolbar">
    <h2>Toolbar</h2>
    <Demo
      boundingSelectors={["#toolbar-doc-demo"]}
      render={() => {
        const ref = useRef<HTMLDivElement>(null)

        return (
          <div id="toolbar-doc-demo" style={{ minHeight: 120 }}>
            <ToolbarArea
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
            >
              <Placeholder ref={ref}>Target element</Placeholder>
            </ToolbarArea>
          </div>
        )
      }}
    />
  </Doc>
)
