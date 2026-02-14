// @codedocs include-wrapper-in-source
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc, Placeholder } from "../macro"
import { Code } from "~/Code"

export const DocDocs = (
  <Doc path="/Docs/Doc">
    <h2>This is an h2</h2>
    <h3>This is an h3</h3>
    <Demo>
      <Placeholder>This is a demo</Placeholder>
    </Demo>
    <h3>And another h3</h3>
    <p>With a paragraph between the h3 and the demo.</p>
    <Demo>
      <Placeholder>This is a demo</Placeholder>
    </Demo>
  </Doc>
)
