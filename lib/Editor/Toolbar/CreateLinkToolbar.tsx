import React, { useState } from "react"
import { Editor, Transforms } from "slate"
import { HistoryEditor } from "slate-history"
import { ReactEditor, useSlate } from "slate-react"
import type { LinkDraft, SlateEditor, ToolbarControls } from "./types"
import { useComponents } from "~/ComponentContext"
import { mergeAdjacentLinks } from "~/Editor/editorHelpers"
import { isLinkElement } from "~/Editor/types"

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
    // Capture range before unwrap; after unwrap the link node is gone so we can't
    // derive it from draft.linkPath anymore.
    const beforeRange = Editor.range(editor, draft.linkPath)
    Transforms.unwrapNodes(editor, {
      at: draft.linkPath,
      match: isLinkElement,
      split: true,
    })
    Transforms.select(editor, beforeRange)
    controls.cancelLinkDraft(editor.selection ?? beforeRange)
    ReactEditor.focus(editor)
  }

  const removeAndClose = () => {
    Transforms.unwrapNodes(editor, {
      at: draft.linkPath,
      match: isLinkElement,
      split: true,
    })
    controls.removeLinkDraft()
    ReactEditor.focus(editor)
  }

  const save = () => {
    const href = url.trim()
    if (!href) {
      throw new Error("Can't create a link with an no URL")
    }
    // Bundle setNodes + merge into one undo step. Use pathRef to track the link's
    // position through merge, since mergeAdjacentLinks may shift paths when
    // combining same-URL neighbors.
    HistoryEditor.withoutMerging(editor, () => {
      Transforms.setNodes(editor, { url: href }, { at: draft.linkPath })
      const pathRef = Editor.pathRef(editor, draft.linkPath)
      try {
        mergeAdjacentLinks(editor)
        const pathAfterMerge = pathRef.current
        if (!pathAfterMerge) {
          throw new Error(
            "CreateLinkToolbar save: link path lost after mergeAdjacentLinks"
          )
        }
        const [node] = Editor.node(editor, pathAfterMerge)
        if (!isLinkElement(node)) {
          throw new Error(
            "CreateLinkToolbar save: node at path after merge is not a link"
          )
        }
        controls.saveLinkDraft(pathAfterMerge, node)
      } finally {
        pathRef.unref()
      }
    })
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
