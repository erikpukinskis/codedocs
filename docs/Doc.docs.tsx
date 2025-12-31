// @codedocs include-wrapper-in-source
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc, Placeholder } from "../macro"
import { Code } from "~/Code"

export const DocDocs = (
  <Doc path="/Docs/Doc">
    <h2>Heading</h2>
    <h3>Subheading</h3>
    <Demo>
      <Placeholder inline>This is a demo</Placeholder>
    </Demo>
    <h3>Subheading</h3>
    <Demo>
      <Placeholder inline>This is a demo</Placeholder>
    </Demo>
  </Doc>
)
