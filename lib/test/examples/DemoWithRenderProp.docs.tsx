import React, { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Doc, Demo } from "../../../macro"

export default <Doc path="/" />

export const DemoWithRenderProp = (
  <Demo
    render={() => {
      const [count, setCount] = useState(0)
      return (
        <button onClick={() => setCount(count + 1)}>Click me ({count})</button>
      )
    }}
  />
)
