import { type ReactNode, type ReactElement, type ReactPortal } from "react"

type SimpleNode = boolean | string | undefined | null | number

function isSimpleNode(node: ReactNode): node is SimpleNode {
  return (
    node == null ||
    typeof node === "boolean" ||
    typeof node === "string" ||
    typeof node === "number"
  )
}

function isReactElement(node: ReactNode): node is ReactElement {
  if (isSimpleNode(node)) return false
  return Object.prototype.hasOwnProperty.call(node, "props")
}

function isReactPortal(node: ReactNode): node is ReactPortal {
  if (isSimpleNode(node)) return false
  if (isReactElement(node)) return false
  return Object.prototype.hasOwnProperty.call(node, "key")
}

function isIterable(node: ReactNode): node is Iterable<ReactNode> {
  if (isSimpleNode(node)) return false
  return typeof (node as Iterable<ReactNode>)[Symbol.iterator] === "function"
}

type ReactElementWithChildren = ReactElement<{
  children: Iterable<ReactNode>
}>

function isElementWithChildren(
  node: ReactElement
): node is ReactElementWithChildren {
  return Object.prototype.hasOwnProperty.call(node.props, "children")
}

export function reactNodeToText(node: ReactNode) {
  const text = _reactNodeToText(node)
  const cleaned = text.replace(/\s+/g, " ").replace(/  */, " ").trim()
  return cleaned
}

function _reactNodeToText(node: ReactNode): string {
  if (node == null) return ""
  if (typeof node === "boolean") return ""
  if (typeof node === "string") return node
  if (typeof node === "number") return node.toString()

  if (isReactElement(node) && isElementWithChildren(node)) {
    return _reactNodeToText(node.props.children)
  }

  if (isReactElement(node)) {
    return "" // not sure if this is really correct
  }

  if (isReactPortal(node)) {
    return _reactNodeToText(node)
  }

  if (isIterable(node)) {
    return Array.from(node).map(_reactNodeToText).join(" ")
  }

  return ""
}
