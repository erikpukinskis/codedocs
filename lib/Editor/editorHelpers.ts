import { Editor, Element as SlateElement, Text, Transforms } from "slate"
import type { Descendant } from "slate"
import type { SlateEditor } from "~/Editor/Toolbar/types"
import { isLinkElement } from "~/Editor/types"

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
