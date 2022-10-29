import { type ReactNode, type ReactElement, type ReactPortal } from "react"

type SimpleNode = boolean | string | number | null | undefined

function isSimpleNode(node: ReactNode): node is SimpleNode {
  return node == null || typeof node === "boolean" || typeof node === "string"
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

function _reactNodeToText(
  node:
    | SimpleNode
    | ReactElement
    | Record<string, never>
    | Iterable<ReactNode>
    | ReactPortal
): string {
  if (node == null) return ""
  if (typeof node === "boolean") return ""
  if (typeof node === "string") return node
  if (typeof node === "number") return node.toString()

  if (isReactElement(node) && isElementWithChildren(node)) {
    return _reactNodeToText(node.props.children)
  }

  if (isReactElement(node)) {
    console.info("this is a ReactElement without children?", node)
    throw new Error(
      "Found a react element without children. We should update reactNodeToText to extract the text from something like this!"
    )
  }

  if (isReactPortal(node)) {
    return _reactNodeToText(node)
  }

  if (isIterable(node)) {
    return Array.from(node).map(_reactNodeToText).join(" ")
  }

  return ""
}
