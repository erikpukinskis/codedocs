import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useMemo } from "react"
import { Editor, Range, Text } from "slate"
import { ReactEditor, useSlate, useSlateSelection } from "slate-react"
import { isCodeBlock, isFrozenBlock, isLineOfCodeElement } from "./types"
import { useComponents } from "~/ComponentContext"
import { useToolbar } from "~/Components/Toolbar"

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

function suppressesFormattingToolbar(editor: Editor): boolean {
  const { selection } = editor
  if (!selection) return true
  const [match] = Editor.nodes(editor, {
    at: selection,
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

  const triggerBounds = useMemo(() => {
    if (!selection || Range.isCollapsed(selection)) return null
    if (!ReactEditor.isFocused(editor)) return null
    if (suppressesFormattingToolbar(editor)) return null
    const rangeForPosition = ghostSelection ?? selection
    try {
      const domRange = ReactEditor.toDOMRange(editor, rangeForPosition)
      const rect = domRange.getClientRects()[0]
      if (!rect || (rect.width === 0 && rect.height === 0)) return null
      return rect
    } catch {
      return null
    }
  }, [editor, selection, ghostSelection])

  const { renderToolbar } = useToolbar({
    open: Boolean(triggerBounds),
    triggerOffset: 6,
    getTriggerBounds: () => triggerBounds,
  })

  if (!triggerBounds || !selection) return null

  const toggleMark = (key: FormatMark) => () => {
    if (isMarkActiveInSelection(editor, key, selection)) {
      Editor.removeMark(editor, key)
    } else {
      Editor.addMark(editor, key, true)
    }
  }

  const toolbar = renderToolbar(
    <>
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
    </>
  )

  return toolbar ? <>{toolbar}</> : null
}
