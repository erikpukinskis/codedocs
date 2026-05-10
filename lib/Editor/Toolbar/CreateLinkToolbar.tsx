import React, { useState } from "react"
import { Text, Transforms } from "slate"
import type { Range } from "slate"
import { HistoryEditor } from "slate-history"
import { ReactEditor, useSlate } from "slate-react"
import type { LinkDraft, SlateEditor, ToolbarControls } from "./types"
import { useComponents } from "~/ComponentContext"
import { mergeAdjacentLinks } from "~/Editor/editorHelpers"
import {
  isLinkElement,
  type LinkElement as LinkElementNode,
} from "~/Editor/types"

export function wrapRangeAsLink(
  editor: SlateEditor,
  range: Range,
  url: string
): void {
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
    mergeAdjacentLinks(editor)
  })
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
    wrapRangeAsLink(editor, draft.range, url)
    controls.saveLinkDraft()
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
