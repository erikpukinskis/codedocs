import type { PluginPass } from "@babel/core"
import traverse from "@babel/traverse"
import type { NodePath } from "@babel/traverse"
import {
  arrayExpression,
  booleanLiteral,
  identifier,
  isBlockStatement,
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
import { formatPlainTextCodeBlock } from "./formatPlainText"
import { formatTypescript } from "./formatTypeScript"

/**
 * AST checks in this helper follow `lib/macro.ts`: prefer `@babel/types` predicates,
 * reuse `babelJsxGuards` for named JSX tags/attributes, `if` / `else if` chains in
 * custom guards with one assertion per line.
 */

/** JSX child node (element children array item). */
export type JSXChild =
  JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment

function getJsxTagName(
  name: JSXElement["openingElement"]["name"],
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
export interface ProcessDocNodeArgs {
  nodePath: NodePath
  state: PluginPass
  code: string
  /** When true, demo source includes the full `<Demo>...</Demo>` wrapper when applicable. */
  includeWrapper: boolean
}

/**
 * For each <Doc> reference: walk its JSX children, classify editable vs frozen,
 * and attach slateDocument, frozenElements, and frozenSources props.
 */
export function processDocNode({
  nodePath,
  state,
  code,
  includeWrapper,
}: ProcessDocNodeArgs): void {
  const parentPath = nodePath.parentPath
  if (!parentPath || !isJSXOpeningElement(parentPath.node)) return

  traverse(
    state.file.path.parent,
    {
      JSXIdentifier(path: NodePath) {
        visitDocJSXIdentifier(path, { state, code, includeWrapper })
      },
    },
    nodePath.scope,
    parentPath,
  )
}

/**
 * Visitor: when we see a "Doc" tag name, transform that <Doc> element.
 */
function visitDocJSXIdentifier(
  path: NodePath,
  ctx: { state: PluginPass; code: string; includeWrapper: boolean },
): void {
  const parentPath = path.parentPath
  if (!parentPath || !isJSXOpeningElement(parentPath.node)) return

  const grandPath = parentPath.parentPath
  if (!grandPath || !isNamedJSXElement(grandPath.node, "Doc")) return

  const jsxElement = grandPath.node
  const openingElement = jsxElement.openingElement

  if (
    openingElement.attributes.some((attr) =>
      isNamedJSXAttribute(attr, "slateDocument"),
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
    freezeBlock(node, processState, ctx.code, ctx.includeWrapper)
  const parseInlineChildrenFn = (childNodes: JSXChild[]) =>
    parseInlineChildren(childNodes)

  /** Direct `<Doc>` children that are phrasing, gathered until the next block. */
  let inlineBuffer: JSXChild[] = []

  /**
   * Turn buffered root-level phrasing into one Slate `paragraph` block.
   *
   * Authors often write prose as siblings under `<Doc>` (text, `{" "}`,
   * `<code>`, …) instead of wrapping in `<p>`. We buffer those children and
   * flush here so they become a single paragraph—similar to one line box under
   * a block container in HTML—then we continue with the next heading, list,
   * block `<code>`, frozen block, etc. If inline parsing fails, we fall back
   * to freezing elements or one-off text paragraphs. Called once at the end of
   * the child walk so trailing phrasing is not lost.
   */
  const flushInlineBuffer = () => {
    if (inlineBuffer.length === 0) return
    const buf = inlineBuffer
    inlineBuffer = []
    const inlineResult = parseInlineChildrenFn(buf)
    if (inlineResult === null) {
      for (const c of buf) {
        if (isJSXElement(c)) {
          freezeBlockFn(c)
        } else if (isJSXText(c)) {
          const t = c.value.trim()
          if (t !== "") {
            processState.blockNodes.push(
              objectExpression([
                objectProperty(identifier("type"), stringLiteral("paragraph")),
                objectProperty(
                  identifier("id"),
                  stringLiteral(`b${processState.blockId++}`),
                ),
                objectProperty(
                  identifier("children"),
                  arrayExpression([
                    objectExpression([
                      objectProperty(identifier("text"), stringLiteral(t)),
                    ]),
                  ]),
                ),
              ]),
            )
          }
        }
      }
      return
    }
    if (inlineResult.length === 0) return
    processState.blockNodes.push(
      objectExpression([
        objectProperty(identifier("type"), stringLiteral("paragraph")),
        objectProperty(
          identifier("id"),
          stringLiteral(`b${processState.blockId++}`),
        ),
        objectProperty(identifier("children"), arrayExpression(inlineResult)),
      ]),
    )
  }

  for (const child of children) {
    if (isJSXText(child)) {
      // HTML-ish: inter-element whitespace collapses to a single space when it
      // sits between phrasing content (see collapseWhitespace on real text nodes).
      if (child.value.trim() === "") {
        if (inlineBuffer.length > 0) {
          inlineBuffer.push(jsxExpressionContainer(stringLiteral(" ")))
        }
        continue
      }
      inlineBuffer.push(child)
      continue
    }

    if (isJSXExpressionContainer(child)) {
      inlineBuffer.push(child)
      continue
    }
    if (!isJSXElement(child)) continue

    const tagName = getJsxTagName(child.openingElement.name)

    if (!tagName) {
      flushInlineBuffer()
      freezeBlockFn(child)
      continue
    }

    const isPhrasingAtRoot =
      tagName === "strong" || tagName === "em" || tagName === "a"

    if (isPhrasingAtRoot) {
      inlineBuffer.push(child)
      continue
    }

    flushInlineBuffer()

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
              stringLiteral(`b${processState.blockId++}`),
            ),
            objectProperty(
              identifier("children"),
              arrayExpression(childrenArr),
            ),
          ]),
        )
      }
      continue
    }

    const headingMatch = tagName.match(/^h([1-6])$/)
    if (headingMatch) {
      const levelStr = headingMatch[1]
      if (levelStr === undefined) {
        continue
      }
      const level = parseInt(levelStr, 10)
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
              stringLiteral(`b${processState.blockId++}`),
            ),
            objectProperty(identifier("level"), numericLiteral(level)),
            objectProperty(
              identifier("children"),
              arrayExpression(childrenArr),
            ),
          ]),
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
      )
      continue
    }

    if (tagName === "code") {
      const languageAttr = child.openingElement.attributes.find(
        (a): a is JSXAttribute => isNamedJSXAttribute(a, "data-language"),
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
        makeCodeBlockNode(language, rawText ?? "", processState),
      )
      continue
    }

    if (tagName === "pre") {
      const codeElement = child.children.find(
        (c): c is JSXElement =>
          isJSXElement(c) && getJsxTagName(c.openingElement.name) === "code",
      )

      // TODO: rewrite to use early returns.
      if (codeElement) {
        const languageAttr = codeElement.openingElement.attributes.find(
          (a): a is JSXAttribute => isNamedJSXAttribute(a, "data-language"),
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
          makeCodeBlockNode(language, rawText ?? "", processState),
        )
        continue
      }
    }

    freezeBlockFn(child)
  }

  flushInlineBuffer()

  openingElement.attributes.push(
    jsxAttribute(
      jsxIdentifier("slateDocument"),
      jsxExpressionContainer(arrayExpression(processState.blockNodes)),
    ),
  )

  if (Object.keys(processState.frozenElements).length > 0) {
    openingElement.attributes.push(
      jsxAttribute(
        jsxIdentifier("frozenElements"),
        jsxExpressionContainer(
          objectExpression(
            Object.entries(processState.frozenElements).map(([id, node]) =>
              objectProperty(stringLiteral(id), node),
            ),
          ),
        ),
      ),
    )
  }

  if (Object.keys(processState.frozenSources).length > 0) {
    openingElement.attributes.push(
      jsxAttribute(
        jsxIdentifier("frozenSources"),
        jsxExpressionContainer(
          objectExpression(
            Object.entries(processState.frozenSources).map(([id, source]) =>
              objectProperty(stringLiteral(id), stringLiteral(source)),
            ),
          ),
        ),
      ),
    )
  }
}

// --- Helpers at file scope (no closure over visitor state) ---

/**
 * Convert inline JSX (text, strong, em, code, a) into Slate leaf/link AST nodes.
 * Returns null if any unknown inline is found (caller should freeze the block).
 */
function parseInlineChildren(
  childNodes: JSXChild[],
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
              stringLiteral(child.expression.value),
            ),
          ]),
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
        (a): a is JSXAttribute => isNamedJSXAttribute(a, "href"),
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
        ]),
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
  { preserveWhitespace = false }: GetJSXTextContentOptions = {},
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
        const quasi = child.expression.quasis[0]
        if (quasi === undefined) {
          return null
        }
        text += quasi.value.cooked ?? ""
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
  processState: ProcessDocState,
): ObjectExpression {
  let textToSplit = rawText
  if (language === "tsx" || language === "typescript") {
    textToSplit = formatTypescript(rawText)
  } else {
    textToSplit = formatPlainTextCodeBlock(rawText)
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
        ]),
      ),
    ]),
  )

  return objectExpression([
    objectProperty(identifier("type"), stringLiteral("code-block")),
    objectProperty(
      identifier("id"),
      stringLiteral(`b${processState.blockId++}`),
    ),
    objectProperty(identifier("language"), stringLiteral(language)),
    objectProperty(identifier("children"), arrayExpression(codeLineNodes)),
  ])
}

/**
 * True when this is `<Demo width="full" />` or `<Demo width={"full"} />` with a
 * string literal only (dynamic widths stay unsupported).
 */
function isStaticDemoFullWidth(node: JSXElement): boolean {
  if (!isNamedJSXElement(node, "Demo")) return false
  const widthAttr = node.openingElement.attributes.find(
    (a): a is JSXAttribute => isNamedJSXAttribute(a, "width"),
  )
  const value = widthAttr?.value
  if (value === undefined) return false
  if (isStringLiteral(value) && value.value === "full") return true
  if (
    isJSXExpressionContainer(value) &&
    isStringLiteral(value.expression) &&
    value.expression.value === "full"
  ) {
    return true
  }
  return false
}

/**
 * Build a Slate void node placeholder for a frozen block (Demo, Code, etc.).
 *
 * `fullWidth` is ALWAYS emitted explicitly (true or false) so the editor's
 * `frozenBlock.fullWidth !== false` check is unambiguous. Previously this was
 * omitted when false, which caused the editor to treat absent as full-width.
 */
function makeFrozenNode(id: string, fullWidth: boolean): ObjectExpression {
  return objectExpression([
    objectProperty(identifier("type"), stringLiteral("frozen")),
    objectProperty(identifier("id"), stringLiteral(id)),
    objectProperty(identifier("fullWidth"), booleanLiteral(fullWidth)),
    objectProperty(
      identifier("children"),
      arrayExpression([
        objectExpression([
          objectProperty(identifier("text"), stringLiteral("")),
        ]),
      ]),
    ),
  ])
}

/** Single empty text leaf; used for empty paragraphs and list items. */
function makeEmptyChildren(): ObjectExpression[] {
  return [
    objectExpression([objectProperty(identifier("text"), stringLiteral(""))]),
  ]
}

function getSource(
  node: { start?: number | null; end?: number | null },
  code: string,
): string {
  const start = node.start ?? 0
  const end = node.end ?? code.length
  return formatTypescript(code.slice(start, end))
}

/**
 * Extract the demo's primary source string from the JSX AST (children or
 * `render` callback).
 *
 * Children demos are plain JSX concatenation (no `mock.callback` in authored source).
 */
function extractDemoSource(
  demoNode: JSXElement,
  code: string,
  includeWrapper: boolean,
): string {
  const opening = demoNode.openingElement
  const noWrapperInSource = opening.attributes.some((attr) =>
    isNamedJSXAttribute(attr, "noWrapperInSource"),
  )
  const renderAttr = opening.attributes.find((a) =>
    isNamedJSXAttribute(a, "render"),
  )
  if (renderAttr?.value?.type === "JSXExpressionContainer") {
    const expression = renderAttr.value.expression
    if (
      expression.type === "ArrowFunctionExpression" ||
      expression.type === "FunctionExpression"
    ) {
      const body = expression.body
      if (body) {
        if (includeWrapper && !noWrapperInSource) {
          return getSource(demoNode, code)
        }
        const bodySource = getSource(body, code)
        if (isBlockStatement(body)) {
          return bodySource.slice(1, bodySource.length - 1).trim()
        }
        return bodySource
      }
    }
  }

  if (includeWrapper && !noWrapperInSource) {
    return getSource(demoNode, code)
  }
  return demoNode.children.map((child) => getSource(child, code)).join("")
}

/**
 * Read `dependencies={...}` and return each value's source text by key
 * (order preserved by `Object.entries` for iteration).
 */
function extractDemoDependencySources(
  demoNode: JSXElement,
  code: string,
): Record<string, string> {
  const dependenciesAttr = demoNode.openingElement.attributes.find(
    (attr): attr is JSXAttribute =>
      isNamedJSXAttribute(attr, "dependencies") &&
      attr.value?.type === "JSXExpressionContainer",
  )
  if (
    !dependenciesAttr?.value ||
    dependenciesAttr.value.type !== "JSXExpressionContainer"
  ) {
    return {}
  }
  const objExpr = dependenciesAttr.value.expression
  if (objExpr.type !== "ObjectExpression") return {}

  const result: Record<string, string> = {}
  for (const prop of objExpr.properties) {
    if (prop.type !== "ObjectProperty") continue
    const keyName =
      prop.key.type === "Identifier"
        ? prop.key.name
        : isStringLiteral(prop.key)
          ? prop.key.value
          : null
    if (keyName === null) continue
    const valueSource = getSource(
      prop.value as { start?: number | null; end?: number | null },
      code,
    )
    result[keyName] = valueSource
  }
  return result
}

/** Record this node as frozen: keep AST + source, push a frozen Slate node. */
function freezeBlock(
  node: JSXElement,
  processState: ProcessDocState,
  code: string,
  includeWrapper: boolean,
): void {
  const id = `f${processState.frozenId++}`
  processState.frozenElements[id] = node
  processState.frozenSources[id] = isNamedJSXElement(node, "Demo")
    ? extractDemoSource(node, code, includeWrapper)
    : getSource(node, code)
  processState.blockNodes.push(makeFrozenNode(id, isStaticDemoFullWidth(node)))

  // For <Demo> elements, also emit sibling code-block(s) carrying the demo's
  // source code as live Slate content (extracted here from the JSX AST).
  if (isNamedJSXElement(node, "Demo")) {
    pushDemoSourceCodeBlocks(node, id, processState, code, includeWrapper)
  }
}

/**
 * Emit one Slate code-block per demo source / dependency, each linked to the
 * frozen block via `demoId` and labeled with a `tab` name.
 *
 * The "Source" tab corresponds to the demo's own source. Each dependency
 * becomes its own tab named after the dependency key.
 */
function pushDemoSourceCodeBlocks(
  demoNode: JSXElement,
  demoId: string,
  processState: ProcessDocState,
  code: string,
  includeWrapper: boolean,
): void {
  const source = extractDemoSource(demoNode, code, includeWrapper)
  processState.blockNodes.push(
    makeDemoCodeBlockNode(source, demoId, "Source", processState),
  )

  const dependencySources = extractDemoDependencySources(demoNode, code)
  for (const [name, depSource] of Object.entries(dependencySources)) {
    processState.blockNodes.push(
      makeDemoCodeBlockNode(depSource, demoId, name, processState),
    )
  }
}

/**
 * Build a Slate code-block AST tagged with `demoId` and `tab`. Reuses the same
 * code-line splitting as a regular `<pre><code>` block so the existing editor
 * rendering and behavior apply.
 */
function makeDemoCodeBlockNode(
  rawText: string,
  demoId: string,
  tab: string,
  processState: ProcessDocState,
): ObjectExpression {
  const formatted = formatTypescript(rawText)
  const lines = formatted.split("\n")
  const codeLineNodes = lines.map((lineText) =>
    objectExpression([
      objectProperty(identifier("type"), stringLiteral("code-line")),
      objectProperty(
        identifier("children"),
        arrayExpression([
          objectExpression([
            objectProperty(identifier("text"), stringLiteral(lineText)),
          ]),
        ]),
      ),
    ]),
  )

  return objectExpression([
    objectProperty(identifier("type"), stringLiteral("code-block")),
    objectProperty(
      identifier("id"),
      stringLiteral(`b${processState.blockId++}`),
    ),
    objectProperty(identifier("language"), stringLiteral("tsx")),
    objectProperty(identifier("demoId"), stringLiteral(demoId)),
    objectProperty(identifier("tab"), stringLiteral(tab)),
    objectProperty(identifier("children"), arrayExpression(codeLineNodes)),
  ])
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
  makeEmptyChildrenFn: () => ObjectExpression[],
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
            stringLiteral(`b${processState.blockId++}`),
          ),
          objectProperty(identifier("listType"), stringLiteral(listType)),
          objectProperty(identifier("depth"), numericLiteral(depth)),
          objectProperty(identifier("children"), arrayExpression(childrenArr)),
        ]),
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
        makeEmptyChildrenFn,
      )
    }
  }
}
