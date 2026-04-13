import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React from "react"
import type { Range } from "slate"
import { Editor, Range as SlateRange } from "slate"
import { ReactEditor, useSlate } from "slate-react"
import type { MatchContext, ToolbarDescriptor } from "./types"
import { useComponents } from "~/ComponentContext"
import type { FormatMark } from "~/helpers/range"
import { isFormattableRange, isMarkActiveInSelection } from "~/helpers/range"

export function matchFormattingToolbar(
  context: MatchContext
): ToolbarDescriptor | null {
  const { editor, selection, focused, ghostSelection } = context

  const hasExpandedSelection = selection && !SlateRange.isCollapsed(selection)
  const candidateRange = hasExpandedSelection
    ? selection
    : focused
    ? undefined
    : ghostSelection

  if (!isFormattableRange(editor, candidateRange)) return null

  let targetRect: DOMRect | undefined
  try {
    const domRange = ReactEditor.toDOMRange(editor, candidateRange)
    const rect = domRange.getClientRects()[0]
    if (rect && !(rect.width === 0 && rect.height === 0)) {
      targetRect = rect
    }
  } catch {
    // toDOMRange can throw when Slate's range no longer maps cleanly to DOM
  }

  if (!targetRect) return null

  return {
    target: targetRect,
    content: <FormattingToolbarContent activeRange={candidateRange} />,
  }
}

type FormattingToolbarContentProps = { activeRange: Range }

const FormattingToolbarContent: React.FC<FormattingToolbarContentProps> = ({
  activeRange,
}) => {
  const editor = useSlate()
  const Components = useComponents()

  const toggleMark = (key: FormatMark) => () => {
    if (!activeRange) return
    if (isMarkActiveInSelection(editor, key, activeRange)) {
      Editor.removeMark(editor, key)
    } else {
      Editor.addMark(editor, key, true)
    }
  }

  return (
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
}
