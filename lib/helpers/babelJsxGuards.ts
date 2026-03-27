import type { CallExpression, StringLiteral } from "@babel/types"
import {
  isJSXAttribute,
  isJSXElement,
  type JSXAttribute,
  type JSXElement,
  type Node,
} from "@babel/types"

/**
 * Shared JSX shape guards for macro + doc processing.
 * Conventions match `lib/macro.ts` (babel predicates, one assertion per branch).
 */

export function isNamedJSXAttribute(
  node: Node | null | undefined,
  name: string
): node is JSXAttribute {
  if (node == null) return false
  else if (!isJSXAttribute(node)) return false
  else if (node.name.type !== "JSXIdentifier") return false
  else return node.name.name === name
}

export function isNamedJSXElement(
  node: Node | null | undefined,
  name: string
): node is JSXElement {
  if (node == null) return false
  else if (!isJSXElement(node)) return false
  else if (!node.openingElement) return false
  else if (node.openingElement.name.type !== "JSXIdentifier") return false
  else return node.openingElement.name.name === name
}

/** `mock.callback("name")` with positions, for stripping displayed demo source. */
export type MockCallbackCall = CallExpression & {
  start: number
  end: number
  arguments: [StringLiteral]
}

export function isMockCallbackNode(node: Node): node is MockCallbackCall {
  if (node.type !== "CallExpression") return false
  else if (node.start == null || node.end == null) return false
  else if (node.arguments.length !== 1) return false
  else if (node.arguments[0].type !== "StringLiteral") return false

  const { callee } = node

  if (callee.type !== "MemberExpression") return false
  else if (callee.object?.type !== "Identifier") return false
  else if (callee.object?.name !== "mock") return false
  else if (callee.property.type !== "Identifier") return false
  else if (callee.property.name !== "callback") return false
  else return true
}
