import { Editor, Range, Text } from "slate"
import type { ReactEditor } from "slate-react"
import { ReactEditor as SlateReactEditor } from "slate-react"
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

// TODO: Rename this to isFormattableRange
export function suppressesFormattingToolbar(
  editor: Editor,
  range: Range
): boolean {
  const [match] = Editor.nodes(editor, {
    at: range,
    match: (n) => isLineOfCodeElement(n) || isCodeBlock(n) || isFrozenBlock(n),
  })
  return Boolean(match)
}

export type FormattingChrome = {
  activeRange: Range | null
  targetRect: DOMRect | undefined
}

/**
 * Determines whether the formatting toolbar should be shown and where to anchor
 * it. Returns both the active Slate range and its viewport DOMRect, or null for
 * each if the toolbar should be hidden.
 *
 * Active range priority:
 *  1. Expanded selection — shown while the editor is focused and text is selected.
 *  2. Ghost selection — shown when the editor loses focus (so the toolbar stays
 *     visible while the user clicks a button in it), but only if no expanded
 *     selection exists.
 *  3. Collapsed selection or no selection — hidden (returns null).
 *
 * Even with an active range, the toolbar is suppressed for code blocks and
 * frozen blocks (see suppressesFormattingToolbar). The rect is derived from the
 * first client rect of the DOM range; if that mapping fails or yields a
 * zero-size rect, the toolbar is also hidden.
 */
// TODO: Inline this logic into UnifiedInlineToolbar, since this behavior is core to that component's primary concern.
export function resolveFormattingChrome(
  editor: Editor,
  selection: Range | null,
  ghostSelection: Range | null,
  focused: boolean
): FormattingChrome {
  const hasExpandedSelection = selection && !Range.isCollapsed(selection)
  const activeRange = hasExpandedSelection
    ? selection
    : focused
    ? null
    : ghostSelection

  let targetRect: DOMRect | undefined
  if (activeRange && !suppressesFormattingToolbar(editor, activeRange)) {
    try {
      const domRange = SlateReactEditor.toDOMRange(
        editor as ReactEditor,
        activeRange
      )
      const rect = domRange.getClientRects()[0]
      if (rect && !(rect.width === 0 && rect.height === 0)) {
        targetRect = rect
      }
    } catch {
      // toDOMRange can throw when Slate’s range no longer maps cleanly to DOM
    }
  }

  if (!targetRect || !activeRange) {
    return { activeRange: null, targetRect: undefined }
  }
  return { activeRange, targetRect }
}
