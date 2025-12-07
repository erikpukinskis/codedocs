// @codedocs include-wrapper-in-source
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc, Placeholder } from "../macro"

export default (
  <Doc path="/Docs/Demos">
    <h2>Full Width</h2>
    <Demo>
      <Placeholder>By default, demos will be rendered full-width.</Placeholder>
    </Demo>

    <h2>Inline</h2>
    <Demo inline>
      <Placeholder style={{ width: "200px" }}>
        Inline demos only grow to fit the content width.
      </Placeholder>
    </Demo>

    <Demo inline>
      <FontAwesomeIcon icon="check" />
    </Demo>

    <h2>Render Prop</h2>
    <p>
      If your demo needs state, or other hooks, you can provide a render prop
      instead of children:
    </p>
    <Demo
      inline
      render={() => {
        const [count, setCount] = useState(0)
        return (
          <button onClick={() => setCount(count + 1)}>
            Click me ({count})
          </button>
        )
      }}
    />
    <p>
      You can also track callbacks in the demo using a mock callback factory.
      For example, a mouse handler:
    </p>
    <Demo
      inline
      render={({ mock }) => (
        <button onClick={mock.callback("handleClick")}>
          Fire a mouse event
        </button>
      )}
    />
    <p>Or a callback with some other arguments:</p>
    <Demo
      inline
      render={({ mock }) => {
        const handleArgs = mock.callback("handleArgs")

        return (
          <button
            onClick={() =>
              handleArgs(
                400,
                function baz() {
                  return true
                },
                new Date()
              )
            }
          >
            Fire custom callback
          </button>
        )
      }}
    />
  </Doc>
)
