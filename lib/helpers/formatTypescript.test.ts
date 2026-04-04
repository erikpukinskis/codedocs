import { describe, test, expect } from "vitest"
import { formatTypescript } from "./formatTypeScript"

describe("formatTypescript", () => {
  test("formatting a standard, minimal doc", () => {
    const input = `
      import { Button } from "./Button"

      export const ButtonDocs = (
        <Doc path="/Docs/Button">
          This is a test.
        </Doc>
      )
    `

    const result = formatTypescript(input)

    expect(result).toMatchInlineSnapshot(`
      "import { Button } from "./Button"

      export const ButtonDocs = (
        <Doc path="/Docs/Button">This is a test.</Doc>
      )"
    `)
  })
})
