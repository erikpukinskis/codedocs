import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useEffect, useState } from "react"
import { Transforms } from "slate"
import type { Path } from "slate"
import { useSlate } from "slate-react"
import type { ToolbarControls } from "./types"
import { useComponents } from "~/ComponentContext"
import { mergeAdjacentLinks } from "~/Editor/editorHelpers"
import {
  isLinkElement,
  type LinkElement as LinkElementNode,
} from "~/Editor/types"

export type EditLinkToolbarProps = {
  linkPath: Path
  linkNode: LinkElementNode
  editing: boolean
  controls: ToolbarControls
}

export const EditLinkToolbar: React.FC<EditLinkToolbarProps> = ({
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
    <>
      <Components.TextInput
        autoFocus
        value={url}
        onChange={setUrl}
        width="200px"
        onEnterPress={trimmedUrl === "" ? remove : save}
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
  ) : (
    <>
      <Components.LinkButton
        to={href}
        variant="borderless"
        onMouseDownCapture={captureMouseDown}
      >
        <FontAwesomeIcon icon="arrow-up-right-from-square" size="xs" />{" "}
        {getHost(href)}
      </Components.LinkButton>
      <Components.Button
        variant="borderless"
        onClick={() => {
          setUrl(linkNode.url)
          controls.beginLinkEdit(linkPath, linkNode)
        }}
        onMouseDownCapture={captureMouseDown}
      >
        <FontAwesomeIcon icon="pen-to-square" size="xs" /> Edit
      </Components.Button>
      <Components.Button
        variant="borderless"
        onClick={remove}
        onMouseDownCapture={captureMouseDown}
      >
        <FontAwesomeIcon icon="trash-can" size="xs" /> Remove
      </Components.Button>
    </>
  )
}

function getHost(url: string) {
  const match = url.match(/^https?:\/\/([^/]+)/)
  return match ? match[1] : url.slice(0, 15)
}
