import { Editor, Text } from "slate"
import type { Range } from "slate"
import { isCodeBlock, isFrozenBlock, isLineOfCodeElement } from "~/Editor/types"

export type FormatMark = "bold" | "italic" | "underline" | "strikethrough"

function textLeavesInRange(editor: Editor, selection: Range): Text[] {
  const out: Text[] = []
  for (const [node] of Editor.nodes(editor, {
    at: selection,
    match: Text.isText,
  })) {
    if (Text.isText(node) && node.text.length > 0) out.push(node)
  }
  return out
}

export function isMarkActiveInSelection(
  editor: Editor,
  key: FormatMark,
  selection: Range
): boolean {
  const leaves = textLeavesInRange(editor, selection)
  if (leaves.length === 0) return false
  return leaves.every((n) => Boolean(n[key]))
}

/** Returns true if the range can be formatted (bold, italic, etc) */
export function isFormattableRange(
  editor: Editor,
  range?: Range
): range is Range {
  if (!range) return false
  const [match] = Editor.nodes(editor, {
    at: range,
    match: (n) => isLineOfCodeElement(n) || isCodeBlock(n) || isFrozenBlock(n),
  })
  return !match
}
