import React from "react"
// eslint-disable-next-line no-restricted-imports
import { Doc, Demo } from "../../../macro"

export default <Doc path="/" />

export const DemoWithMockCallback = (
  <Demo
    render={({ mock }) => (
      <button onClick={mock.callback("onClick")}>Fire a mouse event</button>
    )}
  />
)
