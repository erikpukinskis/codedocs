import type { Descendant, Element as SlateElement, Text } from "slate"

/**
 * Slate elements are nodes that have a type and children. They are the
 * structural part of the document: blocks like paragraphs (type: "paragraph"),
 * headings (type: "heading"), list items (type: "list-item"), and inlines like
 * links (type: "link").
 *
 * Elements can nest (e.g. a paragraph element has children that are leaves or
 * inline elements).
 *
 * TODO: I think we are limiting how much elements can nest, right? Like list
 * items do not contain more lists, we just have a bunch of list items with each
 * their own indentation depth. Should that be reflected here?
 */
type SlateBlock = SlateElement & {
  type: string
  id?: string
  level?: number
  listType?: "ul" | "ol"
  depth?: number
  url?: string
}

/**
 * Slate leaves are node that has text and optional marks (bold, italic, code,
 * etc.) and no children. They are the actual run of characters and their
 * formatting. Leaves are the bottom-level content inside elements.
 */
type SlateLeaf = Text & {
  bold?: boolean
  italic?: boolean
  code?: boolean
}

function isSlateLeaf(node: Descendant): node is SlateLeaf {
  return "text" in node && !("type" in node)
}

function isSlateBlock(node: Descendant): node is SlateBlock {
  return "type" in node
}

function serializeInlineChildren(children: Descendant[]): string {
  return children
    .map((child) => {
      if (isSlateLeaf(child)) {
        return serializeTextNode(child)
      }
      if (isSlateBlock(child) && child.type === "link") {
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
  node: Descendant,
  frozenSources: Record<string, string>
): string {
  if (!isSlateBlock(node)) return ""

  const children = serializeInlineChildren(node.children)

  switch (node.type) {
    case "paragraph":
      return `<p>${children}</p>`
    case "heading": {
      const level = node.level ?? 1
      return `<h${level}>${children}</h${level}>`
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
function serializeListItems(items: SlateBlock[]): string {
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
  nodes: Descendant[],
  frozenSources: Record<string, string>
): string {
  const parts: string[] = []
  let listBuffer: SlateBlock[] = []

  for (const node of nodes) {
    if (isSlateBlock(node) && node.type === "list-item") {
      listBuffer.push(node)
      continue
    }

    if (listBuffer.length > 0) {
      parts.push(serializeListItems(listBuffer))
      listBuffer = []
    }

    parts.push(serializeBlock(node, frozenSources))
  }

  if (listBuffer.length > 0) {
    parts.push(serializeListItems(listBuffer))
  }

  return parts.join("\n")
}
