import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc, Placeholder } from "../../macro"
import { Button } from "./Button"
import { Toolbar } from "./Toolbar"
import { useElementObserver } from "~/hooks/useElementObserver"

export const ToolbarDocs = (
  <Doc path="/Components/Toolbar">
    <h2>Toolbar</h2>
    <Demo
      boundingSelectors={["#toolbar"]}
      render={() => {
        const { ref, element } = useElementObserver()

        return (
          <>
            <Placeholder ref={ref}>Target element</Placeholder>
            {element && (
              <Toolbar id="toolbar" target={element}>
                <Button variant="borderless">
                  <FontAwesomeIcon icon="bold" />
                </Button>
                <Button variant="borderless">
                  <FontAwesomeIcon icon="italic" />
                </Button>
                <Button variant="borderless">
                  <FontAwesomeIcon icon="underline" />
                </Button>
              </Toolbar>
            )}
          </>
        )
      }}
    />
  </Doc>
)
