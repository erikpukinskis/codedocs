import { Editor, Range, Text } from "slate"
import { isCodeBlock, isFrozenBlock, isLineOfCodeElement } from "~/Editor/types"

export type FormatMark =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "code"

export const NON_CODE_FORMAT_MARKS: Exclude<FormatMark, "code">[] = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
]

function textLeavesInRange(editor: Editor, selection: Range): Text[] {
  const out: Text[] = []
  for (const [node, path] of Editor.nodes(editor, {
    at: selection,
    match: Text.isText,
  })) {
    if (!Text.isText(node) || node.text.length === 0) continue

    // Editor.nodes can include leaves that only touch the selection boundary.
    // Ignore leaves that contribute no selected characters; users expect marks
    // to reflect only text actually inside the selection.
    const intersection = Range.intersection(
      selection,
      Editor.range(editor, path)
    )
    if (!intersection || Range.isCollapsed(intersection)) continue

    out.push(node)
  }
  return out
}

export function isMarkActiveInSelection(
  editor: Editor,
  key: FormatMark,
  selection: Range
): boolean {
  const leaves = textLeavesInRange(editor, selection).filter((leaf) =>
    key === "code" ? true : !leaf.code
  )
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
