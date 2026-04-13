import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React from "react"
import type { Range } from "slate"
import { Range as SlateRange, Text, Transforms } from "slate"
import { ReactEditor, useSlate } from "slate-react"
import type { MatchContext, ToolbarDescriptor } from "./types"
import { useComponents } from "~/ComponentContext"
import type { FormatMark } from "~/helpers/range"
import {
  NON_CODE_FORMAT_MARKS,
  isFormattableRange,
  isMarkActiveInSelection,
} from "~/helpers/range"

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

  const matchAnyTextLeaf = (node: unknown) =>
    Text.isText(node) && node.text.length > 0
  const matchNonCodeTextLeaf = (node: unknown) =>
    Text.isText(node) && node.text.length > 0 && !node.code

  const toggleMark = (key: FormatMark) => () => {
    if (!activeRange) return

    if (key === "code") {
      if (isMarkActiveInSelection(editor, key, activeRange)) {
        Transforms.unsetNodes(editor, key, {
          at: activeRange,
          match: matchAnyTextLeaf,
          split: true,
        })
        return
      }

      Transforms.unsetNodes(editor, NON_CODE_FORMAT_MARKS as string[], {
        at: activeRange,
        match: matchAnyTextLeaf,
        split: true,
      })
      Transforms.setNodes(
        editor,
        { code: true },
        {
          at: activeRange,
          match: matchAnyTextLeaf,
          split: true,
        }
      )
      return
    }

    if (isMarkActiveInSelection(editor, key, activeRange)) {
      Transforms.unsetNodes(editor, key, {
        at: activeRange,
        match: matchNonCodeTextLeaf,
        split: true,
      })
      return
    }

    Transforms.setNodes(
      editor,
      { [key]: true },
      {
        at: activeRange,
        match: matchNonCodeTextLeaf,
        split: true,
      }
    )
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
      <Components.Button
        variant="borderless"
        aria-label="Code"
        onClick={toggleMark("code")}
      >
        <FontAwesomeIcon icon="code" />
      </Components.Button>
    </>
  )
}
