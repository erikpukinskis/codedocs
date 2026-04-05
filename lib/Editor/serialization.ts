import type { Descendant } from "slate"
import { Text } from "slate"
import type { ListItemBlock, SlateBlock, SlateLeaf } from "~/Editor/types"
import { isLinkElement, isListItemBlock, isSlateBlock } from "~/Editor/types"

type SerializeSlateFormat = "html" | "jsx"

type SerializeSlateOptions = {
  format: SerializeSlateFormat
  /** When omitted, frozen blocks serialize to "" */
  frozenSources?: Record<string, string>
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeAttrValue(text: string): string {
  return escapeHtml(text)
}

export const CODE_STYLES = [
  "font-family: Consolas, Menlo, 'Courier New', monospace",
  "color: #6b54c0",
]

function serializeTextNode(
  node: SlateLeaf,
  format: SerializeSlateFormat
): string {
  let text = node.text
  if (!text) return ""

  if (format === "html") text = escapeHtml(text)
  if (node.code)
    text = `<code${` style="${CODE_STYLES.join("; ")}"`}>${text}</code>`
  if (node.bold) text = `<strong>${text}</strong>`
  if (node.italic) text = `<em>${text}</em>`

  return text
}

function serializeInlineChildren(
  children: Descendant[],
  options: SerializeSlateOptions
): string {
  const { format } = options
  return children
    .map((child) => {
      if (Text.isText(child)) {
        return serializeTextNode(child, format)
      }
      if (isLinkElement(child)) {
        const inner = serializeInlineChildren(child.children, options)
        if (!child.url) {
          throw new Error("Link has no URL?")
        }
        const href = escapeAttrValue(child.url)
        return `<a href="${href}">${inner}</a>`
      }
      return ""
    })
    .join("")
}

function serializeBlock(
  node: SlateBlock,
  options: SerializeSlateOptions
): string {
  if (!isSlateBlock(node)) return ""

  const children = serializeInlineChildren(node.children, options)
  const { format, frozenSources } = options

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
            .map((c) => (Text.isText(c) ? c.text : ""))
            .join("")
          lines.push(lineText)
        }
      }
      const joinedText = lines.join("\n")
      const body = format === "html" ? escapeHtml(joinedText) : joinedText
      const language = node.language ?? "tsx"
      const langAttr = escapeAttrValue(language)
      const pre =
        format === "html" ? `<pre style="${CODE_STYLES.join("; ")}">` : "<pre>"
      return `${pre}<code data-language="${langAttr}">${body}</code></pre>`
    }
    case "frozen":
      if (!frozenSources || !node.id) return ""
      return frozenSources[node.id] ?? ""
    default:
      return `<p>${children}</p>`
  }
}

/**
 * Reconstructs nested `<ul>/<ol>` + `<li>` structure from the flat
 * list-item-with-depth representation that Slate uses.
 */
function serializeListItems(
  items: ListItemBlock[],
  options: SerializeSlateOptions
): string {
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

    const children = serializeInlineChildren(item.children, options)
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

/**
 * Serialize a Slate fragment or document to an HTML-shaped string.
 * Root must normally be block elements; stray `Text` roots become a single `<p>`.
 */
function serializeSlate(
  nodes: Descendant[],
  options: SerializeSlateOptions
): string {
  const lines: string[] = []
  let listBuffer: ListItemBlock[] = []

  for (const node of nodes) {
    if (Text.isText(node)) {
      if (listBuffer.length > 0) {
        lines.push(serializeListItems(listBuffer, options))
        listBuffer = []
      }
      const inner = serializeTextNode(node, options.format)
      if (inner) lines.push(`<p>${inner}</p>`)
      continue
    }

    if (!isSlateBlock(node)) continue

    if (isListItemBlock(node)) {
      listBuffer.push(node)
      continue
    }

    if (listBuffer.length > 0) {
      lines.push(serializeListItems(listBuffer, options))
      listBuffer = []
    }

    lines.push(serializeBlock(node, options))
  }

  if (listBuffer.length > 0) {
    lines.push(serializeListItems(listBuffer, options))
  }

  return lines.join("\n")
}

type SlateToJsxOptions = {
  frozenSources: Record<string, string>
}

export function slateToJsx(
  nodes: Descendant[],
  { frozenSources }: SlateToJsxOptions
): string {
  return serializeSlate(nodes, {
    format: "jsx",
    frozenSources,
  })
}

export function slateToHtml(nodes: Descendant[]): string {
  return serializeSlate(nodes, {
    format: "html",
  })
}
