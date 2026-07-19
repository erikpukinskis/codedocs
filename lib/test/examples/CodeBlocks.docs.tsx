import React from "react"
// eslint-disable-next-line no-restricted-imports
import { Doc } from "../../../macro"

export const LoneCodeLineDocs = (
  <Doc path="/">
    <code>console.log("hello, world")</code>
  </Doc>
)

export const ParagraphsAboveAndBelowCodeLineDocs = (
  <Doc path="/">
    <p>This is a paragraph above a code block.</p>
    <code>console.log("hello, world")</code>
  </Doc>
)

export const CodeLineWithinParagraphDocs = (
  <Doc path="/">
    <p>
      This is a paragraph, long enough to take its own line and has a
      <code>symbol</code>
      embedded in it.
    </p>
  </Doc>
)

export const CodeLineSurroundedWithTextDocs = (
  <Doc path="/">
    This will be a text node, but because this code tag...
    <code>symbol</code>
    is at the top level, these will become three block-level elements.
  </Doc>
)
