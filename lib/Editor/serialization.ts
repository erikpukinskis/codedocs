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
  if (blocks.length === 1) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return blocks[0]!.text
  }
  return ordered.map(({ tab, text }) => `/** ${tab} */\n${text}`).join("\n\n")
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
  return serializeSlate(nodes, {
    format: "html",
    frozenSources,
  })
}

type SerializeSlateOptions = {
  format: SerializationFormat
  /** When omitted, frozen blocks serialize to "" */
  frozenSources?: Record<string, string>
}

/** Frozen blocks are wrapped in a paragraph so you can place the cursor before/after them. */
function isParagraphWrappedFrozenBlock(node: Descendant): boolean {
  if (!isSlateBlock(node) || node.type !== "paragraph") return false
  if (!node.children.some(isFrozenBlock)) return false
  // TODO(erik): Can we make this stricter? Enforce that it's Text + Frozen + Text and throw an error otherwise?
  return node.children.every(
    (c) => isFrozenBlock(c) || (Text.isText(c) && c.text === "")
  )
}

/** Root-level `frozen` or a paragraph that only contains frozen voids (and empty text). */
function isDemoClusterHeadRootNode(node: Descendant): boolean {
  // TODO(erik): Do we ever just have a frozen node not wrapped in a paragraph?
  return isFrozenBlock(node) || isParagraphWrappedFrozenBlock(node)
}

function firstFrozenIdInRootBlock(node: Descendant): string | null {
  if (isFrozenBlock(node)) return node.id ?? null
  if (isSlateBlock(node) && node.type === "paragraph") {
    for (const c of node.children) {
      if (isFrozenBlock(c) && c.id) return c.id
    }
  }
  return null
}

function skipPastDemoClusterCodeBlocks(
  nodes: Descendant[],
  headIndex: number,
  demoId: string
): number {
  let j = headIndex + 1
  while (j < nodes.length) {
    const n = nodes[j]
    if (n !== undefined && isCodeBlock(n) && n.demoId === demoId) {
      j++
      continue
    }
    break
  }
  return j
}

function renderDemoClusterHtml(
  nodes: Descendant[],
  headIndex: number,
  demoId: string,
  options: SerializeSlateOptions
): string {
  const { format, frozenSources } = options
  const enriched = frozenSources?.[demoId]
  if (typeof enriched === "string" && enriched.length > 0) {
    if (format === "html") {
      return serializeCodeBlock({
        source: enriched,
        language: "tsx",
        format,
      })
    }
    return enriched
  }

  const cluster: CodeBlock[] = []
  let j = headIndex + 1
  while (j < nodes.length) {
    const n = nodes[j]
    if (n !== undefined && isCodeBlock(n) && n.demoId === demoId) {
      cluster.push(n)
      j++
    } else break
  }
  if (cluster.length === 0) return ""

  const tabbed = cluster.map((b, index) => ({
    tab: typeof b.tab === "string" && b.tab.length > 0 ? b.tab : `tab${index}`,
    text: extractCodeBlockSourceText(b),
    index,
  }))
  const combined = demoSourcesWithTabComments(tabbed)
  const lang = cluster[0]?.language ?? "tsx"
  if (format === "html") {
    return serializeCodeBlock({
      source: combined,
      language: lang,
      format,
    })
  }
  return combined
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
  let i = 0

  while (i < nodes.length) {
    const node = nodes[i]

    if (!node) {
      throw new Error("Undefined Slate node?")
    }

    if (Text.isText(node)) {
      if (listBuffer.length > 0) {
        lines.push(serializeListItems(listBuffer, options))
        listBuffer = []
      }
      const inner = serializeTextNode(node, options.format)
      if (inner) lines.push(`<p>${inner}</p>`)
      i++
      continue
    }

    if (!isSlateBlock(node)) {
      throw new Error("Non-Slate block?")
      // i++
      // continue
    }

    if (isListItemBlock(node)) {
      listBuffer.push(node)
      i++
      continue
    }

    if (listBuffer.length > 0) {
      lines.push(serializeListItems(listBuffer, options))
      listBuffer = []
    }

    if (isDemoClusterHeadRootNode(node)) {
      const demoId = firstFrozenIdInRootBlock(node)
      if (demoId) {
        const html = renderDemoClusterHtml(nodes, i, demoId, options)
        lines.push(html)
        i = skipPastDemoClusterCodeBlocks(nodes, i, demoId)
        continue
      }
    }

    lines.push(serializeBlock(node, options))
    const skipId = firstFrozenIdInRootBlock(node)
    if (skipId) {
      i = skipPastDemoClusterCodeBlocks(nodes, i, skipId)
    } else {
      i++
    }
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
