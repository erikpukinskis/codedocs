import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useEffect, useState } from "react"
import { Editor, Element as SlateElement, Text, Transforms } from "slate"
import type { Descendant, Path, Range } from "slate"
import { HistoryEditor } from "slate-history"
import { ReactEditor, useSlate } from "slate-react"
import type { LinkDraft, SlateEditor, ToolbarControls } from "./types"
import { useComponents } from "~/ComponentContext"
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

export type LinkDraftToolbarContentProps = {
  draft: LinkDraft
  controls: ToolbarControls
}

export const LinkDraftToolbarContent: React.FC<
  LinkDraftToolbarContentProps
> = ({ draft, controls }) => {
  const editor = useSlate() as SlateEditor
  const Components = useComponents()
  const [url, setUrl] = useState(draft.initialUrl)
  const trimmedUrl = url.trim()

  const cancel = () => {
    controls.cancelLinkDraft()
    ReactEditor.focus(editor)
  }

  const removeAndClose = () => {
    controls.removeLinkDraft()
    ReactEditor.focus(editor)
  }

  const save = () => {
    controls.saveLinkDraft(url)
    ReactEditor.focus(editor)
  }

  const captureMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("select")) return
    e.preventDefault()
  }

  return (
    <div onMouseDownCapture={captureMouseDown}>
      <Components.TextInput
        value={url}
        onChange={setUrl}
        width="200px"
        onEnterPress={trimmedUrl === "" ? removeAndClose : save}
      />
      <Components.Button variant="borderless" onClick={cancel}>
        Cancel
      </Components.Button>
      <Components.Button
        variant="borderless"
        onClick={save}
        disabled={trimmedUrl === ""}
      >
        Save
      </Components.Button>
    </div>
  )
}

export type LinkToolbarContentProps = {
  linkPath: Path
  linkNode: LinkElementNode
  editing: boolean
  controls: ToolbarControls
}

export const LinkToolbarContent: React.FC<LinkToolbarContentProps> = ({
  linkPath,
  linkNode,
  editing,
  controls,
}) => {
  const editor = useSlate()
  const Components = useComponents()
  const [url, setUrl] = useState(() => linkNode.url)

  useEffect(() => {
    setUrl(linkNode.url)
  }, [linkNode.url])

  useEffect(() => {
    return () => {
      mergeAdjacentLinks(editor)
    }
  }, [editor])

  const save = () => {
    if (url !== linkNode.url) {
      Transforms.setNodes(editor, { url }, { at: linkPath })
    }
    controls.saveLinkEdit()
  }

  const cancel = () => {
    setUrl(linkNode.url)
    controls.cancelLinkEdit()
  }

  const remove = () => {
    Transforms.unwrapNodes(editor, {
      at: linkPath,
      match: isLinkElement,
      split: true,
    })
    controls.removeLink()
  }

  const href = editing ? url : linkNode.url
  const trimmedUrl = url.trim()

  const captureMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("select")) return
    e.preventDefault()
  }

  return editing ? (
    <div onMouseDownCapture={captureMouseDown}>
      <Components.TextInput
        value={url}
        onChange={setUrl}
        width="200px"
        onEnterPress={trimmedUrl === "" ? remove : save}
      />
      <Components.Button variant="borderless" onClick={cancel}>
        Cancel
      </Components.Button>
      <Components.Button
        variant="borderless"
        onClick={save}
        disabled={trimmedUrl === ""}
      >
        Save
      </Components.Button>
    </div>
  ) : (
    <>
      <Components.LinkButton to={href} variant="borderless">
        <FontAwesomeIcon icon="arrow-up-right-from-square" size="xs" />{" "}
        {getHost(href)}
      </Components.LinkButton>
      <Components.Button
        variant="borderless"
        onClick={() => {
          setUrl(linkNode.url)
          controls.beginLinkEdit(linkPath, linkNode)
        }}
      >
        <FontAwesomeIcon icon="pen-to-square" size="xs" /> Edit
      </Components.Button>
      <Components.Button variant="borderless" onClick={remove}>
        <FontAwesomeIcon icon="trash-can" size="xs" /> Remove
      </Components.Button>
    </>
  )
}

/**
 * After the link toolbar closes, scan the entire document and merge any pairs
 * of adjacent link elements that share the same URL.
 *
 * "Adjacent" means the two link siblings are separated by at most one empty
 * text node — the zero-width text Slate inserts between inline elements.
 */
function mergeAdjacentLinks(editor: SlateEditor) {
  // Repeat until a full pass finds no more mergeable pairs (each merge may
  // expose a new pair, e.g. A–B–C with identical URLs).
  let changed = true
  while (changed) {
    changed = false

    outer: for (const [link, path] of Editor.nodes(editor, {
      match: isLinkElement,
    })) {
      const index = path.at(-1)
      if (index === undefined) continue

      const parentPath = path.slice(0, -1)

      let parent: { children: Descendant[] }
      try {
        const [p] = Editor.node(editor, parentPath)
        if (!SlateElement.isElement(p)) continue
        parent = p
      } catch {
        continue
      }

      if (index + 2 >= parent.children.length) continue

      const mid = parent.children[index + 1]
      const next = parent.children[index + 2]

      if (
        mid !== undefined &&
        next !== undefined &&
        isLinkElement(next) &&
        next.url === link.url &&
        Text.isText(mid) &&
        mid.text === ""
      ) {
        // Remove the empty text between the two links, then merge the second
        // link into the first via mergeNodes (which moves children and deletes
        // the now-empty second link).
        Editor.withoutNormalizing(editor, () => {
          Transforms.removeNodes(editor, { at: [...parentPath, index + 1] })
          // After removal b shifts from index+2 to index+1
          Transforms.mergeNodes(editor, { at: [...parentPath, index + 1] })
        })

        changed = true
        break outer
      }
    }
  }
}

function getHost(url: string) {
  const match = url.match(/^https?:\/\/([^/]+)/)
  return match ? match[1] : url.slice(0, 15)
}
