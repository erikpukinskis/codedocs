// @codedocs include-wrapper-in-source
import React, { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc } from "../macro"
import { Placeholder } from "~/Placeholder"

export default (
  <Doc path="/Docs/Demos">
    <h2>Full Width</h2>
    <p>Here is some new stuff</p>
    <Demo>
      <Placeholder>By default, demos will be rendered full-width.</Placeholder>
    </Demo>

    <h2>Inline</h2>
    <Demo inline>
      <Placeholder style={{ width: "200px" }}>
        Inline demos only grow to fit the content width.
      </Placeholder>
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
  </Doc>
)
