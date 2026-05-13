import { TestDocs } from "docs/Test.docs"
import type { DocProps } from "macro"
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
      '<pre style="font-family: Consolas, Menlo, \'Courier New\', monospace; color: #6b54c0"><code data-language="tsx">function hello() {\n  return &#39;world&#39;\n}</code></pre><br />'
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
      '<pre style="font-family: Consolas, Menlo, \'Courier New\', monospace; color: #6b54c0"><code data-language="tsx">const x = 1\nconsole.log(x)</code></pre><br />'
    )
  })

  test("round-trip with processDocNode", () => {
    const element = TestDocs as React.ReactElement<DocProps>
    expect(element.props).toMatchObject({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      slateDocument: expect.any(Array),
    })
    const html = slateToHtml(element.props.slateDocument!)
    expect(html).toMatchInlineSnapshot(`
      "<p>...to test wrapping in the sidebar.</p>
      <h2>Two stateful demos in a row, to test the macro:</h2>
      <p>A <a href="https://www.redhat.com/en/topics/cloud-native-apps/stateful-vs-stateless">link about statefulness</a>.</p>

      <pre style="font-family: Consolas, Menlo, 'Courier New', monospace; color: #6b54c0"><code data-language="tsx">&lt;label id=&quot;x&quot;&gt;
        &lt;input
          type=&quot;checkbox&quot;
          id=&quot;x&quot;
          checked={value}
          onChange={mock.callback(&quot;onChange&quot;)}
        /&gt;
        label
      &lt;/label&gt;</code></pre><br />

      <pre style="font-family: Consolas, Menlo, 'Courier New', monospace; color: #6b54c0"><code data-language="tsx">&lt;label&gt;
        &lt;input
          type=&quot;checkbox&quot;
          checked={value}
          onChange={() =&gt; setValue(!value)}
        /&gt;
        Second checkbox
      &lt;/label&gt;</code></pre><br />

      <pre style="font-family: Consolas, Menlo, 'Courier New', monospace; color: #6b54c0"><code data-language="tsx">&lt;h1&gt;Hello, world!&lt;/h1&gt;
        &lt;p&gt;This is a paragraph.&lt;/p&gt;</code></pre><br />"
    `)
  })
})
