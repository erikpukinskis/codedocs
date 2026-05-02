import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useEffect, useRef, useState } from "react"
import { Editor, Element as SlateElement, Text, Transforms } from "slate"
import type { Descendant, Path } from "slate"
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
  const [isEditing, setIsEditing] = useState(linkNode.url === "")
  const [url, setUrl] = useState(() => linkNode.url)
  const clearPinnedPathRef = useRef(clearPinnedPath)
  clearPinnedPathRef.current = clearPinnedPath

  useEffect(() => {
    return () => {
      mergeAdjacentLinks(editor)
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

/**
 * After the link toolbar closes, scan the entire document and merge any pairs
 * of adjacent link elements that share the same URL.
 *
 * "Adjacent" means the two link siblings are separated by at most one empty
 * text node — the zero-width text Slate inserts between inline elements.
 */
function mergeAdjacentLinks(editor: MatchContext["editor"]) {
  // Repeat until a full pass finds no more mergeable pairs (each merge may
  // expose a new pair, e.g. A–B–C with identical URLs).
  let changed = true
  while (changed) {
    changed = false

    outer: for (const [node, path] of Editor.nodes(editor, {
      match: isLinkElement,
    })) {
      const link = node
      const parentPath = path.slice(0, -1)
      const index = path[path.length - 1]

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
