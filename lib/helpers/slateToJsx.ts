import type { Descendant } from "slate"
import type { ListItemBlock, SlateBlock, SlateLeaf } from "~/Editor/types"
import {
  isLinkElement,
  isListItemBlock,
  isSlateBlock,
  isSlateLeaf,
} from "~/Editor/types"

function serializeInlineChildren(children: Descendant[]): string {
  return children
    .map((child) => {
      if (isSlateLeaf(child)) {
        return serializeTextNode(child)
      }
      // TODO: We probably will want to serialize CodeBlock, ParagraphBlock, etc
      // here eventually. Although it's not currently even possible to create
      // those under a list item.
      if (isLinkElement(child)) {
        const inner = serializeInlineChildren(child.children)
        if (!child.url) {
          throw new Error("Link has no URL?")
        }
        return `<a href="${child.url}">${inner}</a>`
      }
      return ""
    })
    .join("")
}

function serializeTextNode(node: SlateLeaf): string {
  let text = node.text
  if (!text) return ""

  if (node.code) text = `<code>${text}</code>`
  if (node.bold) text = `<strong>${text}</strong>`
  if (node.italic) text = `<em>${text}</em>`

  return text
}

function serializeBlock(
  node: SlateBlock,
  frozenSources: Record<string, string>
): string {
  if (!isSlateBlock(node)) return ""

  const children = serializeInlineChildren(node.children)

  switch (node.type) {
    case "paragraph":
      return `<p>${children}</p>`
    case "heading": {
      const level: number = node.level
      return `<h${level}>${children}</h${level}>`
    }
    case "code-block": {
      const lines: string[] = []
      for (const child of node.children) {
        if (isSlateBlock(child) && child.type === "code-line") {
          const lineText = child.children
            .map((c) => (isSlateLeaf(c) ? c.text : ""))
            .join("")
          lines.push(lineText)
        }
      }
      const joinedText = lines.join("\n")
      const language = node.language ?? "tsx"
      return `<pre><code data-language="${language}">${joinedText}</code></pre>`
    }
    case "frozen":
      return (node.id && frozenSources[node.id]) ?? ""
    default:
      return `<p>${children}</p>`
  }
}

/**
 * Reconstructs nested `<ul>/<ol>` + `<li>` structure from the flat
 * list-item-with-depth representation that Slate uses.
 */
function serializeListItems(items: ListItemBlock[]): string {
  if (items.length === 0) return ""

  let result = ""
  const stack: { listType: string; depth: number }[] = []

  for (const item of items) {
    const depth = item.depth ?? 0
    const listType = item.listType ?? "ul"
    const tag = listType === "ol" ? "ol" : "ul"

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      const popped = stack.pop()
      if (!popped) {
        throw new Error("Nothing popped?")
      }
      const closeTag = popped.listType === "ol" ? "ol" : "ul"
      result += `</${closeTag}>`
    }

    if (stack.length === 0 || stack[stack.length - 1].depth < depth) {
      result += `<${tag}>`
      stack.push({ listType, depth })
    }

    const children = serializeInlineChildren(item.children)
    result += `<li>${children}</li>`
  }

  while (stack.length > 0) {
    const popped = stack.pop()
    if (!popped) {
      throw new Error("Nothing popped?")
    }
    const closeTag = popped.listType === "ol" ? "ol" : "ul"
    result += `</${closeTag}>`
  }

  return result
}

export function slateToJsx(
  nodes: SlateBlock[],
  frozenSources: Record<string, string>
): string {
  /** Accumulated serialized blocks (strings) that will be joined */
  const lines: string[] = []

  /** Consecutive list items that need to be grouped into a single <ul> or <ol> */
  let listBuffer: ListItemBlock[] = []

  for (const node of nodes) {
    if (isListItemBlock(node)) {
      // We found a list item, so buffer it to group with adjacent list items
      listBuffer.push(node)
      continue
    }

    // Otherwise we've hit a non-list block, so flush any buffered lists before continuing.
    if (listBuffer.length > 0) {
      lines.push(serializeListItems(listBuffer))
      listBuffer = []
    }

    lines.push(serializeBlock(node, frozenSources))
  }

  // If there's a remaining buffered list at the bottom of the doc, flush it.
  if (listBuffer.length > 0) {
    lines.push(serializeListItems(listBuffer))
  }

  return lines.join("\n")
}
