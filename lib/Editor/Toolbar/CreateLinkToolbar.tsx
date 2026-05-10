import React, { useState } from "react"
import { Editor, Range, Text, Transforms } from "slate"
import type { NodeEntry, Path } from "slate"
import { HistoryEditor } from "slate-history"
import { ReactEditor, useSlate } from "slate-react"
import type { LinkDraft, SlateEditor, ToolbarControls } from "./types"
import { useComponents } from "~/ComponentContext"
import { mergeAdjacentLinks } from "~/Editor/editorHelpers"
import {
  isLinkElement,
  type LinkElement as LinkElementNode,
} from "~/Editor/types"

function findLinkWrappingRange(
  editor: SlateEditor,
  range: Range
): NodeEntry<LinkElementNode> | undefined {
  const point = Range.start(range)
  const fromStart = Editor.above(editor, {
    at: point,
    match: isLinkElement,
    mode: "lowest",
  })
  if (fromStart) {
    const [node, path] = fromStart
    if (isLinkElement(node)) return [node, path]
  }
  for (const [node, path] of Editor.nodes(editor, {
    at: range,
    match: isLinkElement,
  })) {
    return [node, path]
  }
  return undefined
}

export function wrapRangeAsLink(
  editor: SlateEditor,
  range: Range,
  url: string
): { linkPath: Path; linkNode: LinkElementNode } {
  if (!Editor.hasPath(editor, range.anchor.path)) {
    throw new Error(
      "wrapRangeAsLink: draft range anchor is no longer valid for this document"
    )
  }
  if (!Editor.hasPath(editor, range.focus.path)) {
    throw new Error(
      "wrapRangeAsLink: draft range focus is no longer valid for this document"
    )
  }

  let hasTextInRange = false
  for (const _ of Editor.nodes(editor, {
    at: range,
    match: Text.isText,
  })) {
    hasTextInRange = true
    break
  }
  if (!hasTextInRange) {
    throw new Error(
      "wrapRangeAsLink: no text nodes in range; nothing to wrap as a link"
    )
  }

  let resolved!: { linkPath: Path; linkNode: LinkElementNode }

  HistoryEditor.withoutMerging(editor, () => {
    Transforms.unwrapNodes(editor, {
      at: range,
      match: isLinkElement,
      split: true,
    })
    Transforms.wrapNodes(
      editor,
      {
        type: "link",
        id: `l${Date.now()}`,
        url,
        children: [],
      } as LinkElementNode,
      { at: range, match: Text.isText, split: true }
    )
    // Resolve the link before mergeAdjacentLinks: `mergeAdjacentLinks` does not
    // update this Range, so Range.start(range) can be wrong after merge.
    // `range` is still the Range Slate updated across unwrap/wrap; avoid
    // `editor.selection` because focus may be in the URL field.
    const wrapped = findLinkWrappingRange(editor, range)
    if (!wrapped) {
      throw new Error(
        "wrapRangeAsLink: after wrap, could not find link for draft range"
      )
    }
    const [, linkPath] = wrapped

    const pathRef = Editor.pathRef(editor, linkPath)
    try {
      mergeAdjacentLinks(editor)
      const pathAfterMerge = pathRef.current
      if (!pathAfterMerge) {
        throw new Error(
          "wrapRangeAsLink: link path lost after mergeAdjacentLinks"
        )
      }
      const [node] = Editor.node(editor, pathAfterMerge)
      if (!isLinkElement(node)) {
        throw new Error(
          "wrapRangeAsLink: node at path after merge is not a link element"
        )
      }
      resolved = { linkPath: pathAfterMerge, linkNode: node }
    } finally {
      pathRef.unref()
    }
  })

  return resolved
}

export type CreateLinkToolbarProps = {
  draft: LinkDraft
  controls: ToolbarControls
}

export const CreateLinkToolbar: React.FC<CreateLinkToolbarProps> = ({
  draft,
  controls,
}) => {
  const editor = useSlate() as SlateEditor
  const Components = useComponents()
  const [url, setUrl] = useState(draft.initialUrl)
  const trimmedUrl = url.trim()

  const cancel = () => {
    controls.cancelLinkDraft()
    ReactEditor.focus(editor)
  }

  const removeAndClose = () => {
    Transforms.unwrapNodes(editor, {
      at: draft.range,
      match: isLinkElement,
      split: true,
    })
    controls.removeLinkDraft()
    ReactEditor.focus(editor)
  }

  const save = () => {
    const href = url.trim()
    const created = wrapRangeAsLink(editor, draft.range, href)
    controls.saveLinkDraft(created.linkPath, created.linkNode)
    ReactEditor.focus(editor)
  }

  const captureMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("select")) return
    e.preventDefault()
  }

  return (
    <>
      <Components.TextInput
        autoFocus
        value={url}
        onChange={setUrl}
        width="200px"
        onEnterPress={trimmedUrl === "" ? removeAndClose : save}
      />
      <Components.Button
        variant="borderless"
        onClick={cancel}
        onMouseDownCapture={captureMouseDown}
      >
        Cancel
      </Components.Button>
      <Components.Button
        variant="borderless"
        onClick={save}
        disabled={trimmedUrl === ""}
        onMouseDownCapture={captureMouseDown}
      >
        Save
      </Components.Button>
    </>
  )
}
