import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useMemo } from "react"
import { Editor, Range, Text } from "slate"
import { ReactEditor, useSlate, useSlateSelection } from "slate-react"
import { isCodeBlock, isFrozenBlock, isLineOfCodeElement } from "./types"
import { useComponents } from "~/ComponentContext"
import { Toolbar } from "~/Components/Toolbar"

type FormatMark = "bold" | "italic" | "underline" | "strikethrough"

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

function isMarkActiveInSelection(
  editor: Editor,
  key: FormatMark,
  selection: Range
): boolean {
  const leaves = textLeavesInRange(editor, selection)
  if (leaves.length === 0) return false
  return leaves.every((n) => Boolean(n[key]))
}

function suppressesFormattingToolbar(editor: Editor, range: Range): boolean {
  const [match] = Editor.nodes(editor, {
    at: range,
    match: (n) => isLineOfCodeElement(n) || isCodeBlock(n) || isFrozenBlock(n),
  })
  return Boolean(match)
}

type SelectionFormattingToolbarProps = {
  ghostSelection: Range | null
}

export function SelectionFormattingToolbar({
  ghostSelection,
}: SelectionFormattingToolbarProps): React.ReactElement | null {
  const editor = useSlate()
  const selection = useSlateSelection()
  const Components = useComponents()

  const focused = ReactEditor.isFocused(editor)
  const hasExpandedSelection = selection && !Range.isCollapsed(selection)
  const activeRange = hasExpandedSelection
    ? selection
    : focused
    ? null
    : ghostSelection

  const targetRect = useMemo(() => {
    if (!activeRange) return null
    if (suppressesFormattingToolbar(editor, activeRange)) return null
    try {
      const domRange = ReactEditor.toDOMRange(editor, activeRange)
      const rect = domRange.getClientRects()[0]
      if (!rect || (rect.width === 0 && rect.height === 0)) return null
      return rect
    } catch {
      return null
    }
  }, [editor, activeRange])

  if (!targetRect || !activeRange) return null

  const toggleMark = (key: FormatMark) => () => {
    if (isMarkActiveInSelection(editor, key, activeRange)) {
      Editor.removeMark(editor, key)
    } else {
      Editor.addMark(editor, key, true)
    }
  }

  return (
    <Toolbar target={targetRect}>
      <Components.Button
        variant="borderless"
        aria-label="Bold"
        onClick={toggleMark("bold")}
      >
        <FontAwesomeIcon icon="bold" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Italic"
        onClick={toggleMark("italic")}
      >
        <FontAwesomeIcon icon="italic" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Underline"
        onClick={toggleMark("underline")}
      >
        <FontAwesomeIcon icon="underline" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Strikethrough"
        onClick={toggleMark("strikethrough")}
      >
        <FontAwesomeIcon icon="strikethrough" />
      </Components.Button>
    </Toolbar>
  )
}
