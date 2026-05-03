import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React from "react"
import type { Node, Path, Range } from "slate"
import { Editor, Range as SlateRange, Text, Transforms } from "slate"
import { HistoryEditor } from "slate-history"
import { ReactEditor, useSlate } from "slate-react"
import type {
  MatchContext,
  SlateEditor,
  ToolbarControls,
  ToolbarDescriptor,
} from "./types"
import { useComponents } from "~/ComponentContext"
import * as buttonStyles from "~/Components/Button.css"
import {
  isHeadingBlock,
  isLinkElement,
  isListItemBlock,
  isParagraphBlock,
  type LinkElement,
  type SlateBlock,
} from "~/Editor/types"
import type { FormatMark } from "~/helpers/range"
import {
  NON_CODE_FORMAT_MARKS,
  isFormattableRange,
  isMarkActiveInSelection,
} from "~/helpers/range"

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
  node: Node
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
  options: ApplyBlockTypeOptions<T>
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
      { at: path }
    )
  }
}

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
    content: (
      <FormattingToolbarContent
        activeRange={candidateRange}
        controls={context.controls}
      />
    ),
  }
}

type FormattingToolbarContentProps = {
  activeRange: Range
  controls: ToolbarControls
}

const FormattingToolbarContent: React.FC<FormattingToolbarContentProps> = ({
  activeRange,
  controls,
}) => {
  const editor = useSlate() as SlateEditor
  const Components = useComponents()

  const matchAnyTextLeaf = (node: unknown) =>
    Text.isText(node) && node.text.length > 0
  const matchNonCodeTextLeaf = (node: unknown) =>
    Text.isText(node) && node.text.length > 0 && !node.code

  const toggleMark = (key: FormatMark) => {
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
    // Find the URL of the rightmost (last in document order) link in the
    // selection — used as the initial URL for the new link per Req 2.
    let inheritUrl = ""
    for (const [node] of Editor.nodes(editor, {
      at: activeRange,
      match: isLinkElement,
    })) {
      inheritUrl = node.url
    }

    let newLinkPath: Path | null = null

    // withoutMerging ensures these transforms form a discrete undo entry so
    // cancelling a new link via HistoryEditor.undo() reverts exactly this operation.
    HistoryEditor.withoutMerging(editor, () => {
      // Remove all links that overlap the selection. split: true causes Slate to
      // split any link that extends beyond the selection boundary first, so only
      // the portion inside the selection is unwrapped; the outside portion stays.
      Transforms.unwrapNodes(editor, {
        at: activeRange,
        match: isLinkElement,
        split: true,
      })

      if (!editor.selection) {
        throw new Error(
          "linkSelection: editor.selection was null after unwrapNodes"
        )
      }

      const linkId = `l${Date.now()}`
      // split: true is needed here even though we already removed links above —
      // unwrapNodes + normalization may have merged adjacent text nodes so
      // editor.selection may now span the interior of a single text node; split
      // cuts it at the selection boundaries before wrapping.
      Transforms.wrapNodes(
        editor,
        {
          type: "link",
          id: linkId,
          url: inheritUrl,
          children: [],
        } as LinkElement,
        { at: editor.selection, match: Text.isText, split: true }
      )

      for (const [, path] of Editor.nodes(editor, {
        match: (n) => isLinkElement(n) && n.id === linkId,
      })) {
        newLinkPath = path
        break
      }

      if (!newLinkPath) {
        throw new Error(
          "linkSelection: wrapNodes did not produce a link element"
        )
      }

      // Collapse the editor selection so the FormattingToolbar stops matching
      // and the LinkToolbar can take over via pinnedPath.
      Transforms.deselect(editor)
    })

    // Reaching this point means newLinkPath was set; the throw inside
    // withoutMerging would have propagated if it were null.
    controls.pinPath(newLinkPath as unknown as Path)
  }

  const blockType = blockTypeSelectValue(editor, activeRange)

  return (
    <div onMouseDownCapture={onMouseDownToolbarButton}>
      <select
        value={blockType}
        onChange={(event) => {
          const newBlockType = event.target.value
          if (newBlockType === "paragraph") {
            applyBlockType(editor, activeRange, "paragraph", {})
          } else if (newBlockType === "heading-1") {
            applyBlockType(editor, activeRange, "heading", { level: 1 })
          } else if (newBlockType === "heading-2") {
            applyBlockType(editor, activeRange, "heading", { level: 2 })
          } else if (newBlockType === "heading-3") {
            applyBlockType(editor, activeRange, "heading", { level: 3 })
          } else if (newBlockType === "list") {
            applyBlockType(editor, activeRange, "list-item", {
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
          applyBlockType(editor, activeRange, "list-item", {
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
          applyBlockType(editor, activeRange, "list-item", {
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
