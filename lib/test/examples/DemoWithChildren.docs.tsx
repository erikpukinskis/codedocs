import React from "react"
// eslint-disable-next-line no-restricted-imports
import { Doc, Demo } from "../../../macro"

export default <Doc path="/">Potato</Doc>

export const DemoWithChildren = (
  <Demo>
    Hello, <b>world!</b>
  </Demo>
)
