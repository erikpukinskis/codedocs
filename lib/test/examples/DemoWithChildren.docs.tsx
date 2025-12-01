// eslint-disable-next-line no-restricted-imports
import React from "react"
import { Doc, Demo } from "../../../macro"

export default <Doc path="/" />

export const DemoWithChildren = (
  <Demo>
    Hello, <b>world!</b>
  </Demo>
)
