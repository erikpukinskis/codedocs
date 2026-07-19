import React from "react"
// eslint-disable-next-line no-restricted-imports
import { Doc, Demo } from "../../../macro"

/** Minimal doc for macro: JSXExpressionContainer → … → JSXElement parent chain. */
export const DemoRenderParentChainDocs = (
  <Doc path="/">
    <h2>Demo render parent chain</h2>
    <Demo
      render={() => {
        return <span>macro-demo-render-parent-chain-ok</span>
      }}
    />
  </Doc>
)
