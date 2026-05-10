import { Editor, Element as SlateElement, Range, Text, Transforms } from "slate"
import type { Descendant, NodeEntry, Path } from "slate"
import { HistoryEditor } from "slate-history"
import type { SlateEditor } from "~/Editor/Toolbar/types"
import {
  isLinkElement,
  type LinkElement as LinkElementNode,
} from "~/Editor/types"

/** Placeholder URL while creating a link; Save replaces it with the real href. */
export const LINK_DRAFT_PLACEHOLDER_URL = ""

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

/**
 * Unwrap existing links in the range, wrap text as a link with `url`, then run
 * {@link mergeAdjacentLinks} while tracking the link with a path ref (paths
 * move when neighboring identical URLs merge).
 */
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

/**
 * After the link toolbar closes, scan the entire document and merge any pairs
 * of adjacent link elements that share the same URL.
 *
 * "Adjacent" means the two link siblings are separated by at most one empty
 * text node — the zero-width text Slate inserts between inline elements.
 */
export function mergeAdjacentLinks(editor: SlateEditor) {
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
