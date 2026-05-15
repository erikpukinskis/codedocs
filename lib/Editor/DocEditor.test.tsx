import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test } from "vitest"
import { DocEditor } from "./DocEditor"

describe("DocEditor", () => {
  test("links", async () => {
    const { container, getByText, getByRole } = render(
      <DocEditor slateDocument={[]} frozenElements={{}} />
    )

    getByRole("textbox").focus()
    await userEvent.type(container, "this is some text")

    getByText("this is some text")
  })
})
