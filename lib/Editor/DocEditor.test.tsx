import { cleanup, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, test } from "vitest"
import { DocEditor, EMPTY_DOCUMENT } from "./DocEditor"
import { assertProcessedDocElement } from "~/Doc"
import {
  LoneCodeLineDocs,
  ParagraphsAboveAndBelowCodeLineDocs,
  CodeLineWithinParagraphDocs,
  CodeLineSurroundedWithTextDocs,
} from "~/test/examples/CodeBlocks.docs"

describe("DocEditor", () => {
  afterEach(() => {
    cleanup()
  })

  describe("Single code lines", () => {
    test("lone code line should become a code block", async () => {
      const loneCodeLine = assertProcessedDocElement(LoneCodeLineDocs)

      const { getByRole } = render(
        <DocEditor slateDocument={loneCodeLine.props.slateDocument} />
      )

      expect(getByRole("textbox")).toHaveTextContent(
        '1console.log("hello, world")'
      )
    })

    test("paragraphs above and below a code line should turn it into a code block", async () => {
      const loneCodeLine = assertProcessedDocElement(
        ParagraphsAboveAndBelowCodeLineDocs
      )

      const { getByRole } = render(
        <DocEditor slateDocument={loneCodeLine.props.slateDocument} />
      )

      expect(getByRole("textbox")).toHaveTextContent(
        'This is a paragraph above a code block.1console.log("hello, world")'
      )
    })

    test("code blocks within paragraphs should become inline code elements", async () => {
      const loneCodeLine = assertProcessedDocElement(
        CodeLineWithinParagraphDocs
      )

      const { getByRole } = render(
        <DocEditor slateDocument={loneCodeLine.props.slateDocument} />
      )

      expect(getByRole("textbox")).toHaveTextContent(
        `This is a paragraph, long enough to take its own line and has asymbolembedded in it.`
      )
    })

    test("Even if there are no block level siblings, we can assume all top level code tags are block-level elements.", async () => {
      const loneCodeLine = assertProcessedDocElement(
        CodeLineSurroundedWithTextDocs
      )

      const { getByRole } = render(
        <DocEditor slateDocument={loneCodeLine.props.slateDocument} />
      )

      expect(getByRole("textbox")).toHaveTextContent(
        "This will be a text node, but because this code tag...1symbolis at the top level, these will become three block-level elements."
      )
    })
  })

  test("clearing", () => {
    // editor.focus()
    // select all
    // delete
    // expect: still a code block, but its empty. Cursor is in there. Placeholder is not shown.
    // press backspace
    // expect: now a paragraph block, still empty. Placeholder is shown.
  })

  test("links", async () => {
    const { findByText, getByRole } = render(
      <DocEditor slateDocument={EMPTY_DOCUMENT} frozenElements={{}} />
    )

    const editor = getByRole("textbox")
    editor.focus()
    await userEvent.type(editor, "this is some text")

    await findByText("this is some text")
  })
})
