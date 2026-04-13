import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useEffect, useRef, useState } from "react"
import { Editor, Transforms } from "slate"
import type { Path } from "slate"
import { ReactEditor, useSlate } from "slate-react"
import type { MatchContext, ToolbarDescriptor } from "./types"
import { useComponents } from "~/ComponentContext"
import {
  isLinkElement,
  type LinkElement as LinkElementNode,
} from "~/Editor/types"

export function matchLinkToolbar(
  context: MatchContext
): ToolbarDescriptor | null {
  const { editor, hoverPath, caretPath, pinnedPath, controls } = context
  const activeLinkPath = resolveActiveLinkPath(editor, {
    pinnedPath,
    hoverPath,
    caretPath,
  })
  if (!activeLinkPath) return null

  let linkNode: LinkElementNode
  try {
    const [n] = Editor.node(editor, activeLinkPath)
    if (!isLinkElement(n)) return null
    linkNode = n
  } catch {
    return null
  }

  let linkDom: HTMLElement
  try {
    linkDom = ReactEditor.toDOMNode(editor, linkNode)
  } catch {
    return null
  }

  return {
    target: linkDom,
    content: (
      <LinkToolbarContent
        key={JSON.stringify(activeLinkPath)}
        linkPath={activeLinkPath}
        linkNode={linkNode}
        pinPath={controls.pinPath}
        clearPinnedPath={controls.clearPinnedPath}
      />
    ),
  }
}

type LinkToolbarContentProps = {
  pinPath: (path: Path) => void
  clearPinnedPath: () => void
  linkPath: Path
  linkNode: LinkElementNode
}

const LinkToolbarContent: React.FC<LinkToolbarContentProps> = ({
  linkPath,
  linkNode,
  pinPath,
  clearPinnedPath,
}) => {
  const editor = useSlate()
  const Components = useComponents()
  const [isEditing, setIsEditing] = useState(false)
  const [url, setUrl] = useState(() => linkNode.url)
  const clearPinnedPathRef = useRef(clearPinnedPath)
  clearPinnedPathRef.current = clearPinnedPath

  useEffect(() => {
    return () => {
      clearPinnedPathRef.current()
    }
  }, [])

  const save = () => {
    if (url !== linkNode.url) {
      Transforms.setNodes(editor, { url }, { at: linkPath })
    }
    setIsEditing(false)
    clearPinnedPath()
  }

  const cancel = () => {
    setUrl(linkNode.url)
    setIsEditing(false)
    clearPinnedPath()
  }

  const remove = () => {
    Transforms.unwrapNodes(editor, {
      at: linkPath,
      match: isLinkElement,
    })
    setIsEditing(false)
    clearPinnedPath()
  }

  const href = isEditing ? url : linkNode.url

  return isEditing ? (
    <>
      <Components.TextInput
        value={url}
        onChange={setUrl}
        width="200px"
        onEnterPress={save}
      />
      <Components.Button variant="borderless" onClick={cancel}>
        Cancel
      </Components.Button>
      <Components.Button variant="borderless" onClick={save}>
        Save
      </Components.Button>
    </>
  ) : (
    <>
      <Components.LinkButton to={href} variant="borderless">
        <FontAwesomeIcon icon="arrow-up-right-from-square" size="xs" />{" "}
        {getHost(href)}
      </Components.LinkButton>
      <Components.Button
        variant="borderless"
        onClick={() => {
          pinPath(linkPath)
          setUrl(linkNode.url)
          setIsEditing(true)
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

function getHost(url: string) {
  const match = url.match(/^https?:\/\/([^/]+)/)
  return match ? match[1] : url.slice(0, 15)
}

/**
 * Picks the link path that should drive the link toolbar. We prefer a pinned
 * link while editing, then the hovered link, then the link around a collapsed
 * caret.
 */
function resolveActiveLinkPath(
  editor: MatchContext["editor"],
  candidates: {
    pinnedPath: MatchContext["pinnedPath"]
    hoverPath: MatchContext["hoverPath"]
    caretPath: MatchContext["caretPath"]
  }
): Path | null {
  const priorityOrder = [
    candidates.pinnedPath,
    candidates.hoverPath,
    candidates.caretPath,
  ]
  for (const candidatePath of priorityOrder) {
    if (!candidatePath) continue
    const linkPath = linkPathFromElementPath(editor, candidatePath)
    if (linkPath) return linkPath
  }
  return null
}

function linkPathFromElementPath(
  editor: MatchContext["editor"],
  elementPath: Path
): Path | null {
  try {
    const [node] = Editor.node(editor, elementPath)
    if (isLinkElement(node)) return elementPath

    const above = Editor.above(editor, {
      at: elementPath,
      match: isLinkElement,
      mode: "lowest",
    })
    return above ? above[1] : null
  } catch {
    return null
  }
}
