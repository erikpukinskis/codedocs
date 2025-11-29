import { styled } from "@stitches/react"
import React, { useState } from "react"
import { Demo } from "./Demo"
import type { DemoContext } from "./Demo"
import { Doc } from "./Doc"

const Fill = styled("div", {
  padding: "12px 16px",
  background: `repeating-linear-gradient(-45deg, white, white 3px, #e1e6fe 3px, #e1e6fe 4px)`,
})

export default (
  <Doc path="/Docs/Demos">
    <h2>Full Width</h2>
    <Demo>
      <Fill>By default, demos will be rendered full-width.</Fill>
    </Demo>

    <h2>Inline</h2>
    <Demo inline>
      <Fill style={{ width: "200px" }}>
        Inline demos only grow to fit the content width.
      </Fill>
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
      render={({ mock }: DemoContext) => (
        <button onClick={mock.callback("onClick")}>Fire a mouse event</button>
      )}
    />
    <p>Or a callback with some other arguments:</p>
    <Demo
      inline
      render={({ mock }: DemoContext) => (
        <button
          onClick={() =>
            mock.callback("myHandler")(400, function baz() {
              return true
            })
          }
        >
          Fire custom callback
        </button>
      )}
    />
  </Doc>
)
