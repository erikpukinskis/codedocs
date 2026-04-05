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
      '<pre style="font-family: Consolas, Menlo, \'Courier New\', monospace; color: #6b54c0"><code data-language="tsx">function hello() {\n  return &#39;world&#39;\n}</code></pre>'
    )
  })

  test("inline code in paragraphs gets CODE_STYLES", () => {
    const slateDocument: SlateBlock[] = [
      {
        type: "paragraph",
        id: "b0",
        children: [{ text: "use " }, { text: "fn()", code: true }],
      },
    ]
    const html = slateToHtml(slateDocument)
    expect(html).toBe(
      "<p>use <code style=\"font-family: Consolas, Menlo, 'Courier New', monospace; color: #6b54c0\">fn()</code></p>"
    )
  })

  test("frozen blocks serialize like code blocks when frozenSources is provided", () => {
    const slateDocument: SlateBlock[] = [
      {
        type: "frozen",
        id: "f1",
        children: [{ text: "" }],
      },
    ]
    const html = slateToHtml(slateDocument, {
      frozenSources: { f1: "const x = 1\nconsole.log(x)" },
    })
    expect(html).toBe(
      '<pre style="font-family: Consolas, Menlo, \'Courier New\', monospace; color: #6b54c0"><code data-language="tsx">const x = 1\nconsole.log(x)</code></pre>'
    )
  })
})
