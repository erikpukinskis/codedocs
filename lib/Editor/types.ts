import type { BaseElement, BaseText, Node } from "slate"
import { Element } from "slate"

/**
 * A Slate element node as produced by the macro — all block and inline types
 * used in the editor (paragraph, heading, list-item, link, frozen).
 */
// TODO: would it make sense to make this much more restrictive, and only allow the specific blocks we support?
export type ParagraphBlock = BaseElement & {
  type: "paragraph"
  id: string
  depth?: number
}

export type HeadingBlock = BaseElement & {
  type: "heading"
  id: string
  level: number
}

export type ListItemBlock = BaseElement & {
  type: "list-item"
  id: string
  depth?: number
  listType: "ul" | "ol"
}

export type LinkElement = BaseElement & {
  type: "link"
  id: string
  url: string
}

export type FrozenBlock = BaseElement & {
  type: "frozen"
  id: string
}

export type CodeBlock = BaseElement & {
  type: "code-block"
  id: string
  language: string
}

export type LineOfCodeElement = BaseElement & {
  // TODO: Change to "line-of-code"
  type: "code-line"
  language: string
}

// TODO: Rename to EditorElement
// TODO: Do all of this with Zod, the type guards don't give 100% confidence
export type SlateBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListItemBlock
  | LinkElement
  | FrozenBlock
  | CodeBlock
  | LineOfCodeElement

// TODO: Rename to isEditorElement
export function isSlateBlock(node: Node): node is SlateBlock {
  // Checks for Editor and Text nodes
  if (!Element.isElement(node)) return false
  return "type" in node
}
export function isParagraphBlock(node: Node): node is ParagraphBlock {
  return isSlateBlock(node) && node.type === "paragraph"
}
export function isHeadingBlock(node: Node): node is HeadingBlock {
  return isSlateBlock(node) && node.type === "heading"
}
export function isListItemBlock(node: Node): node is ListItemBlock {
  return isSlateBlock(node) && node.type === "list-item"
}
export function isLinkElement(node: Node): node is LinkElement {
  return isSlateBlock(node) && node.type === "link"
}
export function isFrozenBlock(node: Node): node is FrozenBlock {
  return isSlateBlock(node) && node.type === "frozen"
}
export function isCodeBlock(node: Node): node is CodeBlock {
  return isSlateBlock(node) && node.type === "code-block"
}
export function isLineOfCodeElement(node: Node): node is LineOfCodeElement {
  return isSlateBlock(node) && node.type === "code-line"
}

/**
 * Slate leaves are node that has text and optional marks (bold, italic, code,
 * etc.) and no children. They are the actual run of characters and their
 * formatting. Leaves are the bottom-level content inside elements.
 */
export type SlateLeaf = BaseText & {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
  ghostSelection?: boolean
}
