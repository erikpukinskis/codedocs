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
  const { editor, selection, ghostSelection } = context

  const hasExpandedSelection = selection && !SlateRange.isCollapsed(selection)
  const candidateRange = hasExpandedSelection ? selection : ghostSelection

  if (!isFormattableRange(editor, candidateRange)) return null

  let targetRect: DOMRect | undefined
  try {
    const domRange = ReactEditor.toDOMRange(editor, candidateRange)
    const rect =
      domRange.getClientRects()[0] ?? domRange.getBoundingClientRect()
    if (rect && !(rect.width === 0 && rect.height === 0)) {
      targetRect = rect
    }
  } catch {
    // toDOMRange can throw when Slate's range no longer maps cleanly to DOM
  }

  if (!targetRect && typeof window !== "undefined") {
    const nativeSelection = window.getSelection()
    const nativeRange = nativeSelection?.rangeCount
      ? nativeSelection.getRangeAt(0)
      : null
    const rect =
      nativeRange?.getClientRects()[0] ?? nativeRange?.getBoundingClientRect()
    if (rect && !(rect.width === 0 && rect.height === 0)) {
      targetRect = rect
    }
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

  const toggleMark = (key: FormatMark) => {
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

  const onMouseDownToolbarButton = (event: React.MouseEvent) => {
    // Keep focus in the editor for pointer activation so selection stays active.
    event.preventDefault()
  }

  const onClickToolbarButton =
    (key: FormatMark) => (event: React.MouseEvent) => {
      toggleMark(key)
      // Keyboard-triggered click events report detail=0; keep focus on the button.
      if (event.detail > 0) {
        ReactEditor.focus(editor)
      }
    }

  return (
    <div onMouseDownCapture={onMouseDownToolbarButton}>
      <Components.Button
        variant="borderless"
        aria-label="Bold"
        onClick={onClickToolbarButton("bold")}
      >
        <FontAwesomeIcon icon="bold" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Italic"
        onClick={onClickToolbarButton("italic")}
      >
        <FontAwesomeIcon icon="italic" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Underline"
        onClick={onClickToolbarButton("underline")}
      >
        <FontAwesomeIcon icon="underline" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Strikethrough"
        onClick={onClickToolbarButton("strikethrough")}
      >
        <FontAwesomeIcon icon="strikethrough" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Code"
        onClick={onClickToolbarButton("code")}
      >
        <FontAwesomeIcon icon="code" />
      </Components.Button>
    </div>
  )
}
