import type { PluginPass } from "@babel/core"
import traverse from "@babel/traverse"
import type { NodePath } from "@babel/traverse"
import {
  arrayExpression,
  booleanLiteral,
  identifier,
  isJSXElement,
  isJSXExpressionContainer,
  isJSXIdentifier,
  isJSXOpeningElement,
  isJSXText,
  isStringLiteral,
  isTemplateLiteral,
  jsxAttribute,
  jsxExpressionContainer,
  jsxIdentifier,
  numericLiteral,
  objectExpression,
  objectProperty,
  stringLiteral,
  type JSXAttribute,
  type JSXElement,
  type JSXExpressionContainer,
  type JSXFragment,
  type JSXSpreadChild,
  type JSXText,
  type ObjectExpression,
  type ObjectProperty,
} from "@babel/types"
import { isNamedJSXAttribute, isNamedJSXElement } from "./babelJsxGuards"
import { formatTypescript } from "./formatTypeScript"
import { getSource } from "./processDemoNode"

/**
 * AST checks in this helper follow `lib/macro.ts`: prefer `@babel/types` predicates,
 * reuse `babelJsxGuards` for named JSX tags/attributes, `if` / `else if` chains in
 * custom guards with one assertion per line.
 */

/** JSX child node (element children array item). */
export type JSXChild =
  | JSXText
  | JSXExpressionContainer
  | JSXSpreadChild
  | JSXElement
  | JSXFragment

function getJsxTagName(
  name: JSXElement["openingElement"]["name"]
): string | undefined {
  return isJSXIdentifier(name) ? name.name : undefined
}

/** Mutable state used while processing a single <Doc> element. */
export interface ProcessDocState {
  /** Counter for unique IDs on editable Slate blocks (e.g. "b0", "b1"). Incremented for each paragraph, heading, or list item. */
  blockId: number
  /** Counter for unique IDs on frozen blocks (e.g. "f0", "f1"). Incremented for each frozen child (<Code>, <Demo>, etc.). */
  frozenId: number
  /** Semi-flatted document AST. E.g. nested lists become flat lists with indentation. */
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
  code: string
}

/**
 * For each <Doc> reference: walk its JSX children, classify editable vs frozen,
 * and attach slateDocument, frozenElements, and frozenSources props.
 */
export function processDocNode({
  nodePath,
  state,
  code,
}: ProcessCodedocsDocParams): void {
  const parentPath = nodePath.parentPath
  if (!parentPath || !isJSXOpeningElement(parentPath.node)) return

  traverse(
    state.file.path.parent,
    {
      JSXIdentifier(path: NodePath) {
        visitDocJSXIdentifier(path, { state, code })
      },
    },
    nodePath.scope,
    parentPath
  )
}

/**
 * Visitor: when we see a "Doc" tag name, transform that <Doc> element.
 */
function visitDocJSXIdentifier(
  path: NodePath,
  ctx: { state: PluginPass; code: string }
): void {
  const parentPath = path.parentPath
  if (!parentPath || !isJSXOpeningElement(parentPath.node)) return

  const grandPath = parentPath.parentPath
  if (!grandPath || !isNamedJSXElement(grandPath.node, "Doc")) return

  const jsxElement = grandPath.node
  const openingElement = jsxElement.openingElement

  if (
    openingElement.attributes.some((attr) =>
      isNamedJSXAttribute(attr, "slateDocument")
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

  const makeEmptyChildrenFn = () => makeEmptyChildren()
  const freezeBlockFn = (node: JSXElement) =>
    freezeBlock(node, processState, ctx.code)
  const parseInlineChildrenFn = (childNodes: JSXChild[]) =>
    parseInlineChildren(childNodes)

  for (const child of children) {
    if (isJSXText(child)) {
      const trimmed = child.value.trim()
      // Skip pure whitespace lines, since that's what HTML would do anyway.
      if (trimmed === "") continue
      // Or, if there are actual text nodes at the root of the <Doc> element, turn them into paragraphs:
      processState.blockNodes.push(
        objectExpression([
          objectProperty(identifier("type"), stringLiteral("paragraph")),
          objectProperty(
            identifier("id"),
            stringLiteral(`b${processState.blockId++}`)
          ),
          objectProperty(
            identifier("children"),
            arrayExpression([
              objectExpression([
                objectProperty(identifier("text"), stringLiteral(trimmed)),
              ]),
            ])
          ),
        ])
      )
      continue
    }

    if (isJSXExpressionContainer(child)) continue
    if (!isJSXElement(child)) continue

    const tagName = getJsxTagName(child.openingElement.name)

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
          objectExpression([
            objectProperty(identifier("type"), stringLiteral("paragraph")),
            objectProperty(
              identifier("id"),
              stringLiteral(`b${processState.blockId++}`)
            ),
            objectProperty(
              identifier("children"),
              arrayExpression(childrenArr)
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
          objectExpression([
            objectProperty(identifier("type"), stringLiteral("heading")),
            objectProperty(
              identifier("id"),
              stringLiteral(`b${processState.blockId++}`)
            ),
            objectProperty(identifier("level"), numericLiteral(level)),
            objectProperty(
              identifier("children"),
              arrayExpression(childrenArr)
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
        makeEmptyChildrenFn
      )
      continue
    }

    if (tagName === "code") {
      const languageAttr = child.openingElement.attributes.find(
        (a): a is JSXAttribute => isNamedJSXAttribute(a, "data-language")
      )
      const languageValue = languageAttr?.value
      const language =
        languageValue && isStringLiteral(languageValue)
          ? languageValue.value
          : "tsx"

      const rawText = getJSXTextContent(child.children, {
        preserveWhitespace: true,
      })
      processState.blockNodes.push(
        makeCodeBlockNode(language, rawText ?? "", processState)
      )
      continue
    }

    if (tagName === "pre") {
      const codeElement = child.children.find(
        (c): c is JSXElement =>
          isJSXElement(c) && getJsxTagName(c.openingElement.name) === "code"
      )

      // TODO: rewrite to use early returns.
      if (codeElement) {
        const languageAttr = codeElement.openingElement.attributes.find(
          (a): a is JSXAttribute => isNamedJSXAttribute(a, "data-language")
        )
        const languageValue = languageAttr?.value
        const language =
          languageValue && isStringLiteral(languageValue)
            ? languageValue.value
            : "tsx"

        const rawText = getJSXTextContent(codeElement.children, {
          preserveWhitespace: true,
        })
        processState.blockNodes.push(
          makeCodeBlockNode(language, rawText ?? "", processState)
        )
        continue
      }
    }

    freezeBlockFn(child)
  }

  openingElement.attributes.push(
    jsxAttribute(
      jsxIdentifier("slateDocument"),
      jsxExpressionContainer(arrayExpression(processState.blockNodes))
    )
  )

  if (Object.keys(processState.frozenElements).length > 0) {
    openingElement.attributes.push(
      jsxAttribute(
        jsxIdentifier("frozenElements"),
        jsxExpressionContainer(
          objectExpression(
            Object.entries(processState.frozenElements).map(([id, node]) =>
              objectProperty(stringLiteral(id), node)
            )
          )
        )
      )
    )
  }

  if (Object.keys(processState.frozenSources).length > 0) {
    openingElement.attributes.push(
      jsxAttribute(
        jsxIdentifier("frozenSources"),
        jsxExpressionContainer(
          objectExpression(
            Object.entries(processState.frozenSources).map(([id, source]) =>
              objectProperty(stringLiteral(id), stringLiteral(source))
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
function parseInlineChildren(
  childNodes: JSXChild[]
): ObjectExpression[] | null {
  const result: ObjectExpression[] = []
  for (const child of childNodes) {
    if (isJSXText(child)) {
      const normalized = collapseWhitespace(child)
      if (normalized) {
        result.push(normalized)
      }
      continue
    }

    if (isJSXExpressionContainer(child)) {
      if (isStringLiteral(child.expression)) {
        result.push(
          objectExpression([
            objectProperty(
              identifier("text"),
              stringLiteral(child.expression.value)
            ),
          ])
        )
      }
      continue
    }

    if (!isJSXElement(child)) continue

    const tagName = getJsxTagName(child.openingElement.name)
    if (!tagName) continue

    if (tagName === "strong" || tagName === "em" || tagName === "code") {
      const innerText = getJSXTextContent(child.children)
      if (innerText !== null) {
        const props: ObjectProperty[] = [
          objectProperty(identifier("text"), stringLiteral(innerText)),
        ]
        if (tagName === "strong") {
          props.push(objectProperty(identifier("bold"), booleanLiteral(true)))
        } else if (tagName === "em") {
          props.push(objectProperty(identifier("italic"), booleanLiteral(true)))
        } else if (tagName === "code") {
          props.push(objectProperty(identifier("code"), booleanLiteral(true)))
        }
        result.push(objectExpression(props))
        continue
      }
    }

    if (tagName === "a") {
      const hrefAttr = child.openingElement.attributes.find(
        (a): a is JSXAttribute => isNamedJSXAttribute(a, "href")
      )
      const hrefValue = hrefAttr?.value
      const url = hrefValue && isStringLiteral(hrefValue) ? hrefValue.value : ""
      const linkChildren = parseInlineChildren(child.children)
      if (linkChildren === null) return null

      result.push(
        objectExpression([
          objectProperty(identifier("type"), stringLiteral("link")),
          objectProperty(identifier("url"), stringLiteral(url)),
          objectProperty(identifier("children"), arrayExpression(linkChildren)),
        ])
      )
      continue
    }

    return null
  }
  return result
}

/**
 * Collapses the whitespace in a JSX text node, analogous to what white-space:
 * normal does. For example, in this `<p>` tag:
 *
 * ```html
 * <p>
 *   Hello <strong>world</strong> foo
 * </p>
 * ```
 *
 * There are two text nodes that would be altered by this function. The leading
 * "\n  Hello " node and the trailing " foo\n  " node:
 *
 *  - `"\n  Hello "` -> `"Hello "`
 *  - `" foo\n  "` -> `" foo"`
 *
 * @returns undefined if the text node is empty or only contains whitespace.
 */
function collapseWhitespace(node: JSXText): ObjectExpression | undefined {
  //
  let text = node.value.replace(/\n\s*/g, " ").replace(/\s+/g, " ")
  // If the raw value started/ended with a newline, the resulting edge space
  // is just source formatting — strip it. We check the raw value (not the
  // normalised result) so that a real content space like "Hello " before a
  // <strong> is never accidentally trimmed.
  if (/^\s*\n/.test(node.value)) {
    text = text.trimStart()
  }
  if (/\n\s*$/.test(node.value)) {
    text = text.trimEnd()
  }
  // Skip pure-whitespace nodes that collapsed to nothing or a lone space.
  if (text === "" || text === " ") {
    return undefined
  }

  return objectExpression([
    objectProperty(identifier("text"), stringLiteral(text)),
  ])
}

type GetJSXTextContentOptions = {
  preserveWhitespace?: boolean
}

/**
 * Extract plain text from JSX children; return null if any non-text (e.g.
 * component) is present.
 *
 * Handles three cases:
 *
 *     <div>Hello, world</div>
 *     <div>{`Hello, world`}</div>
 *     <div>"Hello, world"</div>
 */
function getJSXTextContent(
  childNodes: JSXChild[],
  { preserveWhitespace = false }: GetJSXTextContentOptions = {}
): string | null {
  let text = ""
  for (const child of childNodes) {
    if (isJSXText(child)) {
      text += preserveWhitespace
        ? child.value
        : child.value.replace(/\n\s*/g, " ").replace(/\s+/g, " ")
    } else if (isJSXExpressionContainer(child)) {
      if (isStringLiteral(child.expression)) {
        text += child.expression.value
      } else if (
        isTemplateLiteral(child.expression) &&
        child.expression.expressions.length === 0
      ) {
        text += child.expression.quasis[0].value.cooked ?? ""
      } else {
        return null
      }
    } else {
      return null
    }
  }
  return text
}

function makeCodeBlockNode(
  language: string,
  rawText: string,
  processState: ProcessDocState
): ObjectExpression {
  let textToSplit = rawText
  if (language === "tsx" || language === "typescript") {
    textToSplit = formatTypescript(rawText)
  }

  const lines = textToSplit.split("\n")
  const codeLineNodes = lines.map((lineText) =>
    objectExpression([
      objectProperty(identifier("type"), stringLiteral("code-line")),
      objectProperty(
        identifier("children"),
        arrayExpression([
          objectExpression([
            objectProperty(identifier("text"), stringLiteral(lineText)),
          ]),
        ])
      ),
    ])
  )

  return objectExpression([
    objectProperty(identifier("type"), stringLiteral("code-block")),
    objectProperty(
      identifier("id"),
      stringLiteral(`b${processState.blockId++}`)
    ),
    objectProperty(identifier("language"), stringLiteral(language)),
    objectProperty(identifier("children"), arrayExpression(codeLineNodes)),
  ])
}

/** Build a Slate void node placeholder for a frozen block (Demo, Code, etc.). */
function makeFrozenNode(id: string): ObjectExpression {
  return objectExpression([
    objectProperty(identifier("type"), stringLiteral("frozen")),
    objectProperty(identifier("id"), stringLiteral(id)),
    objectProperty(
      identifier("children"),
      arrayExpression([
        objectExpression([
          objectProperty(identifier("text"), stringLiteral("")),
        ]),
      ])
    ),
  ])
}

/** Single empty text leaf; used for empty paragraphs and list items. */
function makeEmptyChildren(): ObjectExpression[] {
  return [
    objectExpression([objectProperty(identifier("text"), stringLiteral(""))]),
  ]
}

/** Record this node as frozen: keep AST + source, push a frozen Slate node. */
function freezeBlock(
  node: JSXElement,
  processState: ProcessDocState,
  code: string
): void {
  const id = `f${processState.frozenId++}`
  processState.frozenElements[id] = node
  processState.frozenSources[id] = getSource(node, code)
  processState.blockNodes.push(makeFrozenNode(id))
}

/**
 * Flatten <ul>/<ol> into a sequence of list-item Slate nodes with listType and depth.
 */
function processListItems(
  listElement: JSXElement,
  listType: string,
  depth: number,
  processState: ProcessDocState,
  parseInlineChildrenFn: (childNodes: JSXChild[]) => ObjectExpression[] | null,
  freezeBlockFn: (node: JSXElement) => void,
  makeEmptyChildrenFn: () => ObjectExpression[]
): void {
  for (const child of listElement.children) {
    if (isJSXText(child)) continue
    if (
      !isJSXElement(child) ||
      getJsxTagName(child.openingElement.name) !== "li"
    ) {
      continue
    }

    const textChildren: JSXChild[] = []
    let nestedList: JSXElement | null = null

    for (const liChild of child.children) {
      const liTagName = isJSXElement(liChild)
        ? getJsxTagName(liChild.openingElement.name)
        : undefined
      if (isJSXElement(liChild) && (liTagName === "ul" || liTagName === "ol")) {
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
        objectExpression([
          objectProperty(identifier("type"), stringLiteral("list-item")),
          objectProperty(
            identifier("id"),
            stringLiteral(`b${processState.blockId++}`)
          ),
          objectProperty(identifier("listType"), stringLiteral(listType)),
          objectProperty(identifier("depth"), numericLiteral(depth)),
          objectProperty(identifier("children"), arrayExpression(childrenArr)),
        ])
      )
    }

    if (nestedList) {
      const nestedType = getJsxTagName(nestedList.openingElement.name) ?? "ul"
      processListItems(
        nestedList,
        nestedType,
        depth + 1,
        processState,
        parseInlineChildrenFn,
        freezeBlockFn,
        makeEmptyChildrenFn
      )
    }
  }
}
