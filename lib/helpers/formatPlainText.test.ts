import { describe, expect, test } from "vitest"
import { formatPlainTextCodeBlock } from "./formatPlainText"

describe("formatPlainTextCodeBlock", () => {
  test("strips surrounding blank lines and dedents", () => {
    const input = `
        npm run codedocs login
        npm run codedocs deploy path/to/my-docs
      `
    const result = formatPlainTextCodeBlock(input)
    expect(result).toBe(
      "npm run codedocs login\nnpm run codedocs deploy path/to/my-docs"
    )
  })
})
