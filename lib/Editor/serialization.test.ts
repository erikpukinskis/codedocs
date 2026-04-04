import { describe, expect, test } from "vitest"
import { slateToHtml } from "./serialization"
import type { SlateBlock } from "~/Editor/types"

describe("slateToHtml", () => {
  test("code blocks should be preformatted text", () => {
    const slateDocument: SlateBlock[] = [
      {
        type: "code-block",
        language: "tsx",
        id: "b1",
        children: [
          {
            type: "code-line",
            language: "tsx",
            children: [{ text: "function hello() {\n  return 'world'\n}" }],
          },
        ],
      },
    ]
    const html = slateToHtml(slateDocument)
    expect(html).toBe(
      '<pre><code data-language="tsx">function hello() {\n  return &#39;world&#39;\n}</code></pre>'
    )
  })
})
