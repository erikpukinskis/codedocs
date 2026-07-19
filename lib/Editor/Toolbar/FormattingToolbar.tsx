import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React from "react"
import type { Node, Range } from "slate"
import { Editor, Range as SlateRange, Text, Transforms } from "slate"
import { ReactEditor, useSlate } from "slate-react"
import type { LinkDraft, SlateEditor, ToolbarControls } from "./types"
import { useComponents } from "~/ComponentContext"
import * as buttonStyles from "~/Components/Button.css"
import {
  LINK_DRAFT_PLACEHOLDER_URL,
  wrapRangeAsLink,
} from "~/Editor/editorHelpers"
import {
  isHeadingBlock,
  isLinkElement,
  isListItemBlock,
  isParagraphBlock,
  type SlateBlock,
} from "~/Editor/types"
import type { FormatMark } from "~/helpers/range"
import { NON_CODE_FORMAT_MARKS, isMarkActiveInSelection } from "~/helpers/range"

/** Element fields for a given block discriminant (no `children`). */
type SlateBlockFields<T extends SlateBlock["type"]> = Omit<
  Extract<SlateBlock, { type: T }>,
  "type" | "children"
>

/** Options for `applyBlockType` — `id` is taken from the existing node at each path. */
type ApplyBlockTypeOptions<T extends SlateBlock["type"]> = Omit<
  SlateBlockFields<T>,
  "id"
>

const unsetBeforeApplyBlockType: Partial<Record<SlateBlock["type"], string[]>> =
  {
    "paragraph": ["level", "listType", "depth"],
    "heading": ["listType", "depth"],
    "list-item": ["level"],
  }

function isTextBlockNode(
  node: Node,
): node is SlateBlock & { type: "paragraph" | "heading" | "list-item" } {
  return isParagraphBlock(node) || isHeadingBlock(node) || isListItemBlock(node)
}

// TODO: This and toggleMark should be factored out as pure functions into a slate helpers file.
function blockTypeSelectValue(editor: SlateEditor, at: Range): string {
  const match = Editor.above(editor, {
    at: SlateRange.start(at),
    match: isTextBlockNode,
  })
  if (!match) return "paragraph"
  const [node] = match
  if (isHeadingBlock(node)) {
    const level = node.level ?? 1
    if (level <= 3) return `heading-${level}`
    return "heading-3"
  }
  if (isListItemBlock(node)) {
    return "list"
  }
  return "paragraph"
}

function applyBlockType<T extends SlateBlock["type"]>(
  editor: SlateEditor,
  at: Range,
  type: T,
  options: ApplyBlockTypeOptions<T>,
) {
  const toUnset = unsetBeforeApplyBlockType[type]
  const seen = new Set<string>()
  for (const [node, path] of Editor.nodes(editor, {
    at,
    match: isTextBlockNode,
  })) {
    const key = path.join(",")
    if (seen.has(key)) continue
    seen.add(key)

    const id =
      "id" in node && typeof (node as { id?: unknown }).id === "string"
        ? (node as { id: string }).id
        : `b${Date.now()}`

    if (toUnset?.length) {
      Transforms.unsetNodes(editor, toUnset, { at: path })
    }

    Transforms.setNodes(
      editor,
      {
        type,
        id,
        ...(options as Record<string, unknown>),
      } as Partial<SlateBlock>,
      { at: path },
    )
  }
}

export type FormattingToolbarContentProps = {
  range: Range
  controls: ToolbarControls
}

export const FormattingToolbarContent: React.FC<
  FormattingToolbarContentProps
> = ({ range, controls }) => {
  const editor = useSlate() as SlateEditor
  const Components = useComponents()

  const matchAnyTextLeaf = (node: unknown) =>
    Text.isText(node) && node.text.length > 0
  const matchNonCodeTextLeaf = (node: unknown) =>
    Text.isText(node) && node.text.length > 0 && !node.code

  const toggleMark = (key: FormatMark) => {
    if (key === "code") {
      if (isMarkActiveInSelection(editor, key, range)) {
        Transforms.unsetNodes(editor, key, {
          at: range,
          match: matchAnyTextLeaf,
          split: true,
        })
        return
      }

      Transforms.unsetNodes(editor, NON_CODE_FORMAT_MARKS as string[], {
        at: range,
        match: matchAnyTextLeaf,
        split: true,
      })
      Transforms.setNodes(
        editor,
        { code: true },
        {
          at: range,
          match: matchAnyTextLeaf,
          split: true,
        },
      )
      return
    }

    if (isMarkActiveInSelection(editor, key, range)) {
      Transforms.unsetNodes(editor, key, {
        at: range,
        match: matchNonCodeTextLeaf,
        split: true,
      })
      return
    }

    Transforms.setNodes(
      editor,
      { [key]: true },
      {
        at: range,
        match: matchNonCodeTextLeaf,
        split: true,
      },
    )
  }

  const captureMouseDown = (event: React.MouseEvent) => {
    // Native <select> needs default mousedown to open; still keep editor focus for icon buttons.
    if ((event.target as HTMLElement).closest("select")) return
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

  const linkSelection = () => {
    let inheritUrl = ""
    for (const [node] of Editor.nodes(editor, {
      at: range,
      match: isLinkElement,
    })) {
      inheritUrl = node.url
    }

    const { linkPath, linkNode } = wrapRangeAsLink(
      editor,
      range,
      LINK_DRAFT_PLACEHOLDER_URL,
    )
    const draft: LinkDraft = {
      linkPath,
      linkNode,
      initialUrl: inheritUrl,
    }
    controls.beginLinkDraft(draft)
  }

  const blockType = blockTypeSelectValue(editor, range)

  return (
    <div onMouseDownCapture={captureMouseDown}>
      <select
        value={blockType}
        onChange={(event) => {
          const newBlockType = event.target.value
          if (newBlockType === "paragraph") {
            applyBlockType(editor, range, "paragraph", {})
          } else if (newBlockType === "heading-1") {
            applyBlockType(editor, range, "heading", { level: 1 })
          } else if (newBlockType === "heading-2") {
            applyBlockType(editor, range, "heading", { level: 2 })
          } else if (newBlockType === "heading-3") {
            applyBlockType(editor, range, "heading", { level: 3 })
          } else if (newBlockType === "list") {
            applyBlockType(editor, range, "list-item", {
              listType: "ul",
              depth: 0,
            })
          }
          ReactEditor.focus(editor)
        }}
        className={buttonStyles.button({ variant: "borderless" })}
        style={{ width: "7.5em" }}
      >
        <option value="paragraph">Paragraph</option>
        <option value="heading-1">Heading 1 (Page)</option>
        <option value="heading-2">Heading 2 (Section)</option>
        <option value="heading-3">Heading 3 (Subsection)</option>
        <option value="list">List Item</option>
      </select>
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
        aria-label="Link"
        onClick={linkSelection}
      >
        <FontAwesomeIcon icon="link" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Code"
        onClick={onClickToolbarButton("code")}
      >
        <FontAwesomeIcon icon="code" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="List"
        onClick={() => {
          applyBlockType(editor, range, "list-item", {
            listType: "ul",
            depth: 0,
          })
          ReactEditor.focus(editor)
        }}
      >
        <FontAwesomeIcon icon="list-ul" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Numbered List"
        onClick={() => {
          applyBlockType(editor, range, "list-item", {
            listType: "ol",
            depth: 0,
          })
          ReactEditor.focus(editor)
        }}
      >
        <FontAwesomeIcon icon="list-ol" />
      </Components.Button>
    </div>
  )
}
