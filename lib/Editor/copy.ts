import { Editor, Element, Range } from "slate"
import { slateToHtml } from "./serialization"
import { isCodeBlock } from "./types"

// TODO: rename to clipboard.ts

/**
 * Build text/plain for a range by walking selected blocks in document order.
 * Slate's default instead clones the DOM; our line-number gutter exists only
 * in the DOM, so mixing DOM-based plain text (no code) with document-based
 * plain text (when code is included) would make the same logical content copy
 * differently depending on selection. We always replace text/plain with this
 * after Slate runs so behavior is stable.
 */
export function copyPlainText(editor: Editor, range: Range): string {
  const chunks: string[] = []
  for (const [, path] of Editor.nodes(editor, {
    at: range,
    match: (n) =>
      Element.isElement(n) && Editor.isBlock(editor, n) && !isCodeBlock(n),
  })) {
    const blockRange = Editor.range(editor, path)
    const intersection = Range.intersection(range, blockRange)
    if (!intersection || Range.isCollapsed(intersection)) continue
    chunks.push(Editor.string(editor, intersection))
  }
  return chunks.join("\n")
}

export function copyHtml(editor: Editor, range: Range): string {
  const fragment = Editor.fragment(editor, range)
  return slateToHtml(fragment)
}
