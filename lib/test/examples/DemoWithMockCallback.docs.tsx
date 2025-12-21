import React from "react"
// eslint-disable-next-line no-restricted-imports
import { Doc, Demo } from "../../../macro"

export const DemoWithMockCallbackDocs = (
  <Doc path="/">
    <h2>Demo With Mock Callback</h2>
    <Demo
      render={({ mock }) => (
        <button onClick={mock.callback("handleClick")}>
          Fire a mouse event
        </button>
      )}
    />
  </Doc>
)
