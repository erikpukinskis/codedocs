import React, { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Doc, Demo } from "../../../macro"

export const DemoWithRenderPropDocs = (
  <Doc path="/">
    <h2>Demo With Render Prop</h2>
    <Demo
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
