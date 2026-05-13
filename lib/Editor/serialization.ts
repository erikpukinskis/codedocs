import type { Descendant } from "slate"
import { Text } from "slate"
import type {
  CodeBlock,
  ListItemBlock,
  SlateBlock,
  SlateLeaf,
} from "~/Editor/types"
import {
  isCodeBlock,
  isFrozenBlock,
  isLinkElement,
  isListItemBlock,
  isSlateBlock,
} from "~/Editor/types"

export type SerializationFormat = "html" | "jsx"

type SlateToJsxOptions = {
  frozenSources: Record<string, string>
}

/**
 * Converts our internal Slate nodes back into JSX, layering in the original
 * sources for all the frozen blocks.
 */
export function slateToJsx(
  nodes: Descendant[],
  { frozenSources }: SlateToJsxOptions
): string {
  return serializeSlate(nodes, {
    format: "jsx",
    frozenSources,
  })
}

type SlateToHtmlOptions = {
  /** Original source for frozen blocks; when set, HTML matches code-block `<pre><code>` output */
  frozenSources?: Record<string, string>
}

/**
 * Demo macro emits a `frozen` block plus a primary `"Source"` code-block with the
 * same body. For HTML (clipboard, Google Docs) we keep the code-block (editable
 * source) and omit the frozen placeholder so content is not duplicated.
 */
export function dedupeFrozenDemoAndPrimarySourceForHtml(
  nodes: Descendant[]
): Descendant[] {
  const out: Descendant[] = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node === undefined) continue
    const next = nodes[i + 1]
    if (
      isFrozenBlock(node) &&
      next !== undefined &&
      isCodeBlock(next) &&
      next.demoId === node.id &&
      next.tab === "Source"
    ) {
      out.push(next)
      i += 1
      continue
    }
    out.push(node)
  }
  return out
}

/** Join `code-line` text for a `code-block` (same layout as HTML serialization). */
export function extractCodeBlockSourceText(node: CodeBlock): string {
  const lines: string[] = []
  for (const child of node.children) {
    if (isSlateBlock(child) && child.type === "code-line") {
      const lineText = child.children
        .map((c) => (Text.isText(c) ? c.text : ""))
        .join("")
      lines.push(lineText)
    }
  }
  return lines.join("\n")
}

function orderDemoSourceTabsForHtml(
  blocks: { tab: string; text: string; index: number }[]
): { tab: string; text: string; index: number }[] {
  return [...blocks].sort((a, b) => {
    const aPrimary = a.tab === "Source" ? 0 : 1
    const bPrimary = b.tab === "Source" ? 0 : 1
    if (aPrimary !== bPrimary) return aPrimary - bPrimary
    return a.index - b.index
  })
}

/**
 * One source string with each demo tab section prefixed by `/** name *\/` (Source first).
 */
export function demoSourcesWithTabComments(
  blocks: { tab: string; text: string; index: number }[]
): string {
  const ordered = orderDemoSourceTabsForHtml(blocks)
  return ordered.map(({ tab, text }) => `/** ${tab} */\n${text}`).join("\n\n")
}

/**
 * Merge consecutive `code-block`s for the same `demoId` (Source tab first in macro order)
 * into one block so HTML paste is a single `<pre>` with tab section comments.
 */
export function mergeDemoCodeBlockClustersForHtml(
  nodes: Descendant[]
): Descendant[] {
  const out: Descendant[] = []
  let i = 0
  while (i < nodes.length) {
    const node = nodes[i]
    if (node === undefined) {
      i += 1
      continue
    }
    if (
      isCodeBlock(node) &&
      typeof node.demoId === "string" &&
      node.demoId.length > 0 &&
      node.tab === "Source"
    ) {
      const demoId = node.demoId
      const cluster: CodeBlock[] = []
      while (i < nodes.length) {
        const cur = nodes[i]
        if (cur === undefined) break
        if (!isCodeBlock(cur) || cur.demoId !== demoId) break
        cluster.push(cur)
        i += 1
      }
      const first = cluster[0]
      if (first === undefined) continue
      const tabbed = cluster.map((b, index) => ({
        tab:
          typeof b.tab === "string" && b.tab.length > 0 ? b.tab : `tab${index}`,
        text: extractCodeBlockSourceText(b),
        index,
      }))
      const combined = demoSourcesWithTabComments(tabbed)
      const lang = first.language ?? "tsx"
      const merged: CodeBlock = {
        type: "code-block",
        id: first.id,
        language: lang,
        children: [
          {
            type: "code-line",
            language: lang,
            children: [{ text: combined }],
          },
        ],
      }
      out.push(merged)
      continue
    }
    out.push(node)
    i += 1
  }
  return out
}

/**
 * Converts our internal Slate nodes into HTML, with enough inline styles that
 * it works well when pasted into various common rich text editors (Google Docs,
 * etc)
 */
export function slateToHtml(
  nodes: Descendant[],
  { frozenSources }: SlateToHtmlOptions = {}
): string {
  const prepared = mergeDemoCodeBlockClustersForHtml(
    dedupeFrozenDemoAndPrimarySourceForHtml(nodes)
  )
  return serializeSlate(prepared, {
    format: "html",
    frozenSources,
  })
}

type SerializeSlateOptions = {
  format: SerializationFormat
  /** When omitted, frozen blocks serialize to "" */
  frozenSources?: Record<string, string>
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
  format: SerializationFormat
): string {
  let text = node.text
  if (!text) return ""

  if (format === "html") text = escapeHtml(text)
  if (node.code)
    text = `<code${` style="${CODE_STYLES.join("; ")}"`}>${text}</code>`
  if (node.strikethrough) text = `<s>${text}</s>`
  if (node.underline) text = `<u>${text}</u>`
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
      if (isFrozenBlock(child)) {
        if (!child.id) return ""
        const source = options.frozenSources?.[child.id]
        if (source === undefined) return ""

        if (format === "html") {
          return serializeCodeBlock({
            source,
            language: "tsx",
            format,
          })
        }
        return source
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
    case "paragraph": {
      const hasFrozen = node.children.some(isFrozenBlock)
      if (
        hasFrozen &&
        node.children.every(
          (c) => isFrozenBlock(c) || (Text.isText(c) && c.text === "")
        )
      ) {
        return children
      }
      return `<p>${children}</p>`
    }
    case "heading": {
      const level: number = node.level
      // TODO: These should not get <b> or font-size=17 when pasted into Google Docs.
      return `<h${level}>${children}</h${level}>`
    }
    case "code-block": {
      const joinedText = extractCodeBlockSourceText(node)
      return serializeCodeBlock({
        source: joinedText,
        language: node.language,
        format,
      })
    }
    case "frozen": {
      if (!node.id) return ""
      const source = frozenSources?.[node.id]
      if (source === undefined) return ""

      if (format === "html") {
        return serializeCodeBlock({
          source,
          language: "tsx",
          format,
        })
      }
      return source
    }
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

    while (stack.length > 0) {
      const top = stack[stack.length - 1]
      if (top === undefined || top.depth < depth) {
        break
      }
      const popped = stack.pop()
      if (!popped) {
        throw new Error("Nothing popped?")
      }
      const closeTag = popped.listType === "ol" ? "ol" : "ul"
      result += `</${closeTag}>`
    }

    const stackTop = stack[stack.length - 1]
    if (
      stack.length === 0 ||
      stackTop === undefined ||
      stackTop.depth < depth
    ) {
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

export type SerializeCodeBlockArgs = {
  source: string
  language?: string
  format: SerializationFormat
}

export function serializeCodeBlock({
  source,
  language = "tsx",
  format,
}: SerializeCodeBlockArgs): string {
  const body = format === "html" ? escapeHtml(source) : source
  const langAttr = escapeAttrValue(language)
  const pre =
    format === "html" ? `<pre style="${CODE_STYLES.join("; ")}">` : "<pre>"
  return `${pre}<code data-language="${langAttr}">${body}</code></pre><br />`
}
