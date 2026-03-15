import traverse from "@babel/traverse"
import type { PluginPass } from "@babel/core"
import type { NodePath } from "@babel/traverse"
import type {
  arrayExpression,
  booleanLiteral,
  identifier,
  JSXElement,
  jsxAttribute,
  jsxExpressionContainer,
  jsxIdentifier,
  numericLiteral,
  ObjectExpression,
  objectExpression,
  objectProperty,
  stringLiteral,
} from "@babel/types"

/** Only the @babel/types builders we use for building Slate document AST. */
type BabelTypes = {
  // TODO: Really? We need to be this explicit?
  arrayExpression: typeof arrayExpression
  booleanLiteral: typeof booleanLiteral
  identifier: typeof identifier
  jsxAttribute: typeof jsxAttribute
  jsxExpressionContainer: typeof jsxExpressionContainer
  jsxIdentifier: typeof jsxIdentifier
  numericLiteral: typeof numericLiteral
  objectExpression: typeof objectExpression
  objectProperty: typeof objectProperty
  stringLiteral: typeof stringLiteral
}

/** Extracts source code for an AST node. */
export type GetSource = (
  node: { start: number; end: number },
  code: string
) => string

/** Mutable state used while processing a single <Doc> element. */
export interface ProcessDocState {
  /** Counter for unique IDs on editable Slate blocks (e.g. "b0", "b1"). Incremented for each paragraph, heading, or list item. */
  blockId: number
  /** Counter for unique IDs on frozen blocks (e.g. "f0", "f1"). Incremented for each frozen child (<Code>, <Demo>, etc.). */
  frozenId: number
  /** Semi-flatted document AST — . */
  blockNodes: ObjectExpression[]
  /** Map of frozen block id → JSX AST node. Used to build the frozenElements prop (id → AST) for runtime rendering. */
  frozenElements: Record<string, JSXElement>
  /** The source code for each frozen element, for when we need to convert the Slate document back to TSX */
  frozenSources: Record<string, string>
}

/**
 * Processes <Doc> JSX elements during the codedocs macro: walks children,
 * classifies editable vs frozen blocks, and attaches slateDocument,
 * frozenElements, and frozenSources props.
 *
 * Used by lib/macro.ts.
 */
export interface ProcessCodedocsDocParams {
  nodePath: NodePath
  state: PluginPass
  babel: { types: BabelTypes }
  code: string
  getSource: GetSource
}

/**
 * For each <Doc> reference: walk its JSX children, classify editable vs frozen,
 * and attach slateDocument, frozenElements, and frozenSources props.
 */
export function processDocNode({
  nodePath,
  state,
  babel,
  code,
  getSource,
}: ProcessCodedocsDocParams): void {
  if (nodePath.parentPath.node.type !== "JSXOpeningElement") return

  traverse(
    state.file.path.parent,
    {
      JSXIdentifier(path: any) {
        visitDocJSXIdentifier(path, {
          state,
          babel,
          code,
          getSource,
        })
      },
    },
    nodePath.scope,
    nodePath.parentPath
  )
}

/**
 * Visitor: when we see a "Doc" tag name, transform that <Doc> element.
 */
function visitDocJSXIdentifier(
  path: any,
  ctx: {
    state: { file: { path: { parent: any } } }
    babel: { types: BabelTypes }
    code: string
    getSource: GetSource
  }
): void {
  if (path.node.name !== "Doc") return
  if (path.parentPath.node.type !== "JSXOpeningElement") return

  const jsxElement = path.parentPath.parentPath.node
  if (jsxElement.type !== "JSXElement") return

  const openingElement = jsxElement.openingElement

  if (
    openingElement.attributes.some(
      (attr: any) =>
        attr.type === "JSXAttribute" && attr.name.name === "slateDocument"
    )
  ) {
    return
  }

  const children = jsxElement.children
  const processState: ProcessDocState = {
    blockId: 0,
    frozenId: 0,
    blockNodes: [],
    frozenElements: {},
    frozenSources: {},
  }

  const t = ctx.babel.types

  const makeFrozenNodeFn = (id: string) => makeFrozenNode(t, id)
  const makeEmptyChildrenFn = () => makeEmptyChildren(t)
  const freezeBlockFn = (node: any) =>
    freezeBlock(node, processState, ctx.code, ctx.getSource, makeFrozenNodeFn)
  const parseInlineChildrenFn = (childNodes: any[]) =>
    parseInlineChildren(t, childNodes)

  for (const child of children) {
    if (child.type === "JSXText") {
      const trimmed = child.value.trim()
      if (trimmed) {
        processState.blockNodes.push(
          t.objectExpression([
            t.objectProperty(
              t.identifier("type"),
              t.stringLiteral("paragraph")
            ),
            t.objectProperty(
              t.identifier("id"),
              t.stringLiteral(`b${processState.blockId++}`)
            ),
            t.objectProperty(
              t.identifier("children"),
              t.arrayExpression([
                t.objectExpression([
                  t.objectProperty(
                    t.identifier("text"),
                    t.stringLiteral(trimmed)
                  ),
                ]),
              ])
            ),
          ])
        )
      }
      continue
    }

    if (child.type === "JSXExpressionContainer") continue
    if (child.type !== "JSXElement") continue

    const tagName = child.openingElement.name?.name

    if (!tagName) {
      freezeBlockFn(child)
      continue
    }

    if (tagName === "p") {
      const inlineResult = parseInlineChildrenFn(child.children)
      if (inlineResult === null) {
        freezeBlockFn(child)
      } else {
        const childrenArr =
          inlineResult.length > 0 ? inlineResult : makeEmptyChildrenFn()
        processState.blockNodes.push(
          t.objectExpression([
            t.objectProperty(
              t.identifier("type"),
              t.stringLiteral("paragraph")
            ),
            t.objectProperty(
              t.identifier("id"),
              t.stringLiteral(`b${processState.blockId++}`)
            ),
            t.objectProperty(
              t.identifier("children"),
              t.arrayExpression(childrenArr)
            ),
          ])
        )
      }
      continue
    }

    const headingMatch = tagName.match(/^h([1-6])$/)
    if (headingMatch) {
      const level = parseInt(headingMatch[1], 10)
      const inlineResult = parseInlineChildrenFn(child.children)
      if (inlineResult === null) {
        freezeBlockFn(child)
      } else {
        const childrenArr =
          inlineResult.length > 0 ? inlineResult : makeEmptyChildrenFn()
        processState.blockNodes.push(
          t.objectExpression([
            t.objectProperty(t.identifier("type"), t.stringLiteral("heading")),
            t.objectProperty(
              t.identifier("id"),
              t.stringLiteral(`b${processState.blockId++}`)
            ),
            t.objectProperty(t.identifier("level"), t.numericLiteral(level)),
            t.objectProperty(
              t.identifier("children"),
              t.arrayExpression(childrenArr)
            ),
          ])
        )
      }
      continue
    }

    if (tagName === "ul" || tagName === "ol") {
      processListItems(
        child,
        tagName,
        0,
        processState,
        parseInlineChildrenFn,
        freezeBlockFn,
        makeEmptyChildrenFn,
        t
      )
      continue
    }

    freezeBlockFn(child)
  }

  openingElement.attributes.push(
    t.jsxAttribute(
      t.jsxIdentifier("slateDocument"),
      t.jsxExpressionContainer(t.arrayExpression(processState.blockNodes))
    )
  )

  if (Object.keys(processState.frozenElements).length > 0) {
    openingElement.attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier("frozenElements"),
        t.jsxExpressionContainer(
          t.objectExpression(
            Object.entries(processState.frozenElements).map(([id, node]) =>
              t.objectProperty(t.stringLiteral(id), node)
            )
          )
        )
      )
    )
  }

  if (Object.keys(processState.frozenSources).length > 0) {
    openingElement.attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier("frozenSources"),
        t.jsxExpressionContainer(
          t.objectExpression(
            Object.entries(processState.frozenSources).map(([id, source]) =>
              t.objectProperty(t.stringLiteral(id), t.stringLiteral(source))
            )
          )
        )
      )
    )
  }
}

// --- Helpers at file scope (no closure over visitor state) ---

/**
 * Convert inline JSX (text, strong, em, code, a) into Slate leaf/link AST nodes.
 * Returns null if any unknown inline is found (caller should freeze the block).
 */
function parseInlineChildren(t: BabelTypes, childNodes: any[]): any[] | null {
  const result: any[] = []
  for (const child of childNodes) {
    if (child.type === "JSXText") {
      const text = child.value.replace(/\n\s*/g, " ").replace(/\s+/g, " ")
      if (text && text !== " ") {
        result.push(
          t.objectExpression([
            t.objectProperty(t.identifier("text"), t.stringLiteral(text)),
          ])
        )
      }
      continue
    }

    if (child.type === "JSXExpressionContainer") {
      if (child.expression.type === "StringLiteral") {
        result.push(
          t.objectExpression([
            t.objectProperty(
              t.identifier("text"),
              t.stringLiteral(child.expression.value)
            ),
          ])
        )
      }
      continue
    }

    if (child.type !== "JSXElement") continue

    const tagName = child.openingElement.name?.name
    if (!tagName) continue

    if (tagName === "strong" || tagName === "em" || tagName === "code") {
      const innerText = getJSXTextContent(child.children)
      if (innerText !== null) {
        const props: any[] = [
          t.objectProperty(t.identifier("text"), t.stringLiteral(innerText)),
        ]
        if (tagName === "strong") {
          props.push(
            t.objectProperty(t.identifier("bold"), t.booleanLiteral(true))
          )
        } else if (tagName === "em") {
          props.push(
            t.objectProperty(t.identifier("italic"), t.booleanLiteral(true))
          )
        } else if (tagName === "code") {
          props.push(
            t.objectProperty(t.identifier("code"), t.booleanLiteral(true))
          )
        }
        result.push(t.objectExpression(props))
        continue
      }
    }

    if (tagName === "a") {
      const hrefAttr = child.openingElement.attributes.find(
        (a: any) => a.type === "JSXAttribute" && a.name.name === "href"
      )
      const url =
        hrefAttr && hrefAttr.value
          ? hrefAttr.value.type === "StringLiteral"
            ? hrefAttr.value.value
            : ""
          : ""
      const linkChildren = parseInlineChildren(t, child.children)
      if (linkChildren === null) return null

      result.push(
        t.objectExpression([
          t.objectProperty(t.identifier("type"), t.stringLiteral("link")),
          t.objectProperty(t.identifier("url"), t.stringLiteral(url)),
          t.objectProperty(
            t.identifier("children"),
            t.arrayExpression(linkChildren)
          ),
        ])
      )
      continue
    }

    return null
  }
  return result
}

/**
 * Extract plain text from JSX children; return null if any non-text (e.g. component) is present.
 */
function getJSXTextContent(childNodes: any[]): string | null {
  let text = ""
  for (const child of childNodes) {
    if (child.type === "JSXText") {
      text += child.value.replace(/\n\s*/g, " ").replace(/\s+/g, " ")
    } else if (child.type === "JSXExpressionContainer") {
      if (child.expression.type === "StringLiteral") {
        text += child.expression.value
      } else {
        return null
      }
    } else {
      return null
    }
  }
  return text
}

/** Build a Slate void node placeholder for a frozen block (Demo, Code, etc.). */
function makeFrozenNode(t: BabelTypes, id: string): any {
  return t.objectExpression([
    t.objectProperty(t.identifier("type"), t.stringLiteral("frozen")),
    t.objectProperty(t.identifier("id"), t.stringLiteral(id)),
    t.objectProperty(
      t.identifier("children"),
      t.arrayExpression([
        t.objectExpression([
          t.objectProperty(t.identifier("text"), t.stringLiteral("")),
        ]),
      ])
    ),
  ])
}

/** Single empty text leaf; used for empty paragraphs and list items. */
function makeEmptyChildren(t: BabelTypes): any[] {
  return [
    t.objectExpression([
      t.objectProperty(t.identifier("text"), t.stringLiteral("")),
    ]),
  ]
}

/** Record this node as frozen: keep AST + source, push a frozen Slate node. */
function freezeBlock(
  node: JSXElement,
  processState: ProcessDocState,
  code: string,
  getSource: GetSource,
  makeFrozenNodeFn: (id: string) => any
): void {
  const id = `f${processState.frozenId++}`
  processState.frozenElements[id] = node
  processState.frozenSources[id] = getSource(
    node as { start: number; end: number },
    code
  )
  processState.blockNodes.push(makeFrozenNodeFn(id))
}

/**
 * Flatten <ul>/<ol> into a sequence of list-item Slate nodes with listType and depth.
 */
function processListItems(
  listElement: any,
  listType: string,
  depth: number,
  processState: ProcessDocState,
  parseInlineChildrenFn: (childNodes: any[]) => any[] | null,
  freezeBlockFn: (node: any) => void,
  makeEmptyChildrenFn: () => any[],
  t: BabelTypes
): void {
  for (const child of listElement.children) {
    if (child.type === "JSXText") continue
    if (
      child.type !== "JSXElement" ||
      child.openingElement.name?.name !== "li"
    ) {
      continue
    }

    const textChildren: any[] = []
    let nestedList: any = null

    for (const liChild of child.children) {
      if (
        liChild.type === "JSXElement" &&
        (liChild.openingElement.name?.name === "ul" ||
          liChild.openingElement.name?.name === "ol")
      ) {
        nestedList = liChild
      } else {
        textChildren.push(liChild)
      }
    }

    const inlineResult = parseInlineChildrenFn(textChildren)
    if (inlineResult === null) {
      freezeBlockFn(child)
    } else {
      const childrenArr =
        inlineResult.length > 0 ? inlineResult : makeEmptyChildrenFn()

      processState.blockNodes.push(
        t.objectExpression([
          t.objectProperty(t.identifier("type"), t.stringLiteral("list-item")),
          t.objectProperty(
            t.identifier("id"),
            t.stringLiteral(`b${processState.blockId++}`)
          ),
          t.objectProperty(t.identifier("listType"), t.stringLiteral(listType)),
          t.objectProperty(t.identifier("depth"), t.numericLiteral(depth)),
          t.objectProperty(
            t.identifier("children"),
            t.arrayExpression(childrenArr)
          ),
        ])
      )
    }

    if (nestedList) {
      const nestedType = nestedList.openingElement.name?.name
      processListItems(
        nestedList,
        nestedType,
        depth + 1,
        processState,
        parseInlineChildrenFn,
        freezeBlockFn,
        makeEmptyChildrenFn,
        t
      )
    }
  }
}
