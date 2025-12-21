import React from "react"
// eslint-disable-next-line no-restricted-imports
import { Doc, Demo } from "../../../macro"

export const DemoWithChildrenDocs = (
  <Doc path="/">
    <h2>Demo With Children</h2>
    <Demo>
      Hello, <b>world!</b>
    </Demo>
  </Doc>
)
