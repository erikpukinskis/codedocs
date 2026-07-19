import type { Descendant } from "slate"
import { Editor, Element, Range, Text } from "slate"
import {
  demoSourcesWithTabComments,
  extractCodeBlockSourceText,
  slateToHtml,
} from "./serialization"
import { isCodeBlock, isFrozenBlock, type CodeBlock } from "./types"

// TODO: rename to clipboard.ts

/**
 * Build text/plain for a range by walking selected blocks in document order.
 * Slate's default instead clones the DOM; our line-number gutter exists only
 * in the DOM, so mixing DOM-based plain text (no code) with document-based
 * plain text (when code is included) would make the same logical content copy
 * differently depending on selection. We always replace text/plain with this
 * after Slate runs so behavior is stable.
 */
export function copyPlainText(
  editor: Editor,
  range: Range,
  frozenSources?: Record<string, string>,
): string {
  const chunks: string[] = []
  for (const [_node, path] of Editor.nodes(editor, {
    at: range,
    match: (n) =>
      Element.isElement(n) && Editor.isBlock(editor, n) && !isCodeBlock(n),
  })) {
    const blockRange = Editor.range(editor, path)
    const intersection = Range.intersection(range, blockRange)
    if (!intersection || Range.isCollapsed(intersection)) continue

    const blockChunks: string[] = []
    for (const [inlineNode, inlinePath] of Editor.nodes(editor, {
      at: intersection,
      match: (n) => Text.isText(n) || isFrozenBlock(n),
    })) {
      if (isFrozenBlock(inlineNode)) {
        const liveAll = liveDemoClipboardPlainText(editor, inlineNode.id)
        if (liveAll !== null) {
          blockChunks.push(liveAll)
        } else if (frozenSources && inlineNode.id in frozenSources) {
          const frozen = frozenSources[inlineNode.id]
          if (frozen !== undefined) {
            blockChunks.push(frozen)
          }
        }
      } else if (Text.isText(inlineNode)) {
        const textRange = Editor.range(editor, inlinePath)
        const textIntersection = Range.intersection(intersection, textRange)
        if (textIntersection) {
          blockChunks.push(Editor.string(editor, textIntersection))
        }
      }
    }
    chunks.push(blockChunks.join(""))
  }
  return chunks.join("\n")
}

function collectDemoCodeBlocksForFrozen(
  editor: Editor,
  demoFrozenId: string,
): { tab: string; text: string; index: number }[] {
  const blocks: { tab: string; text: string; index: number }[] = []
  let index = 0
  for (const [n] of Editor.nodes(editor, {
    at: [],
    match: (node): node is CodeBlock =>
      Element.isElement(node) &&
      isCodeBlock(node) &&
      node.demoId === demoFrozenId &&
      typeof node.tab === "string" &&
      node.tab.length > 0,
  })) {
    const tab = n.tab
    if (typeof tab !== "string") continue
    blocks.push({
      tab,
      text: extractCodeBlockSourceText(n),
      index: index++,
    })
  }
  return blocks
}

function liveDemoClipboardPlainText(
  editor: Editor,
  frozenId: string,
): string | null {
  const blocks = collectDemoCodeBlocksForFrozen(editor, frozenId)
  if (blocks.length === 0) return null
  return demoSourcesWithTabComments(blocks)
}

function collectFrozenIdsFromFragment(nodes: Descendant[]): Set<string> {
  const ids = new Set<string>()
  const walk = (descendants: Descendant[]) => {
    for (const n of descendants) {
      if (isFrozenBlock(n) && n.id) ids.add(n.id)
      if (
        Element.isElement(n) &&
        "children" in n &&
        Array.isArray(n.children)
      ) {
        walk(n.children)
      }
    }
  }
  walk(nodes)
  return ids
}

/**
 * For every frozen id in the fragment, attach combined demo tab sources from the
 * live editor (when present) so HTML serialization can render one `<pre>` per demo.
 */
function buildEnrichedFrozenSources(
  editor: Editor,
  fragment: Descendant[],
  base?: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...base }
  for (const id of collectFrozenIdsFromFragment(fragment)) {
    const blocks = collectDemoCodeBlocksForFrozen(editor, id)
    if (blocks.length > 0) {
      out[id] = demoSourcesWithTabComments(blocks)
    }
  }
  return out
}

export function copyHtml(
  editor: Editor,
  range: Range,
  frozenSources?: Record<string, string>,
): string {
  const fragment = Editor.fragment(editor, range)
  const enriched = buildEnrichedFrozenSources(editor, fragment, frozenSources)
  return slateToHtml(fragment, { frozenSources: enriched })
}
