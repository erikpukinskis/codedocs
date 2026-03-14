const { createMacro } = require("babel-plugin-macros")
const { default: traverse } = require("@babel/traverse")
const prettier = require("prettier")
const parserTypescript = require("prettier/parser-typescript")

/**
 * Formats TypeScript/TSX source code using Prettier.
 * @param {string} source - The source code to format
 * @returns {string} The formatted source code
 */
function formatTypescript(source) {
  try {
    let sourceToFormat = source
    let wrappedInFragment = false

    // Quick heuristic: if we see JSX closing tags followed by opening tags, likely multiple roots
    // This handles cases like: <h1>...</h1><p>...</p>
    const hasMultipleRoots = /<\/\w+>\s*<\w+/.test(source)

    if (hasMultipleRoots) {
      sourceToFormat = `<>${source}</>`
      wrappedInFragment = true
    }

    const formatted = prettier
      .format(sourceToFormat, {
        parser: "typescript",
        plugins: [parserTypescript],
        printWidth: 55,
        semi: false,
      })
      .replace(/^;/, "")
      .trim()

    // Remove the fragment wrapper if we added it
    if (wrappedInFragment) {
      return formatted.slice(2, -3).trim() // Remove <>...</>
    }

    return formatted
  } catch (e) {
    // If formatting fails, return the original source
    return source
  }
}

module.exports = createMacro(function Demo({ references, state, babel }) {
  /**
   * SYNCME: Update this list when adding new exports
   */
  const {
    Demo = [],
    Doc = [],
    DocsApp = [],
    Component = [],
    Mockup = [],
    Code = [],
    Placeholder = [],
  } = references

  const code = state.file.code
  const includeWrapperInSource = code.startsWith(
    "// @codedocs include-wrapper-in-source"
  )

  function setSourceAttribute(node, source) {
    const formattedSource = formatTypescript(source)
    const newAttribute = babel.types.jsxAttribute(
      babel.types.jsxIdentifier("source"),
      babel.types.jsxExpressionContainer(
        babel.types.templateLiteral(
          [babel.types.templateElement({ raw: formattedSource }, true)],
          []
        )
      )
    )

    const existingSourceAttributeIndex = node.attributes.findIndex(
      (attribute) => attribute.name.name === "source"
    )

    if (existingSourceAttributeIndex >= 0) {
      node.attributes[existingSourceAttributeIndex] = newAttribute
    } else {
      node.attributes.push(newAttribute)
    }
  }

  /**
   * Finds the dependencies attribute and extracts source for each dependency.
   * Adds a dependencySources attribute with the extracted sources.
   */
  function setDependencySourcesAttribute(openingElement) {
    const dependenciesAttr = openingElement.attributes.find(
      (attr) =>
        attr.type === "JSXAttribute" &&
        attr.name.name === "dependencies" &&
        attr.value?.type === "JSXExpressionContainer"
    )

    if (!dependenciesAttr) return

    const objExpr = dependenciesAttr.value.expression
    if (objExpr.type !== "ObjectExpression") return

    // Transform: dependencies={{ ChildComponent: () => <div/> }}
    // Into:      dependencySources={{ "ChildComponent": `() => <div/>` }}
    //
    // We iterate over each property in the dependencies object and build
    // a corresponding property for dependencySources where the value is
    // the raw source code string (as a template literal).
    const dependencySourcesProperties = objExpr.properties
      // Filter for actual object properties (Babel uses "ObjectProperty",
      // some parsers use "Property" - handle both)
      .filter(
        (prop) => prop.type === "ObjectProperty" || prop.type === "Property"
      )
      .map((prop) => {
        // Get the property name, e.g. "ChildComponent"
        // Handles both `ChildComponent: ...` (Identifier) and `"ChildComponent": ...` (StringLiteral)
        const keyName =
          prop.key.type === "Identifier" ? prop.key.name : prop.key.value

        // Extract the raw source code of the value (the component function)
        // e.g. "() => { const data = useMyHook(); return <>{data}</> }"
        const valueSource = getSource(prop.value, code)

        // Build an AST node for: "ChildComponent": `() => { ... }`
        const formattedValueSource = formatTypescript(valueSource)
        return babel.types.objectProperty(
          babel.types.stringLiteral(keyName),
          babel.types.templateLiteral(
            [babel.types.templateElement({ raw: formattedValueSource }, true)],
            []
          )
        )
      })

    if (dependencySourcesProperties.length === 0) return

    // Guard against adding duplicates (the traverse runs once per Demo in the file,
    // so this function gets called multiple times for the same element)
    const alreadyHasDependencySources = openingElement.attributes.some(
      (attr) =>
        attr.type === "JSXAttribute" && attr.name.name === "dependencySources"
    )
    if (alreadyHasDependencySources) return

    const dependencySourcesAttr = babel.types.jsxAttribute(
      babel.types.jsxIdentifier("dependencySources"),
      babel.types.jsxExpressionContainer(
        babel.types.objectExpression(dependencySourcesProperties)
      )
    )

    openingElement.attributes.push(dependencySourcesAttr)
  }

  /**
   * For each <Doc> reference: walk its JSX children, classify editable vs frozen,
   * and attach slateDocument, frozenElements, and frozenSources props.
   */
  Doc.forEach(function processCodedocsDoc(nodePath) {
    if (nodePath.parentPath.node.type !== "JSXOpeningElement") return

    traverse(
      state.file.path.parent,
      {
        /**
         * Visitor: when we see a "Doc" tag name, transform that <Doc> element.
         */
        JSXIdentifier(path) {
          if (path.node.name !== "Doc") return
          if (path.parentPath.node.type !== "JSXOpeningElement") return

          const jsxElement = path.parentPath.parentPath.node
          if (jsxElement.type !== "JSXElement") return

          const openingElement = jsxElement.openingElement

          // Skip if already processed
          if (
            openingElement.attributes.some(
              (attr) =>
                attr.type === "JSXAttribute" &&
                attr.name.name === "slateDocument"
            )
          ) {
            return
          }

          const children = jsxElement.children
          const slateNodes = []
          const frozenElementsData = []
          const frozenSourcesData = []
          let blockId = 0
          let frozenId = 0

          /**
           * Convert inline JSX (text, strong, em, code, a) into Slate leaf/link AST nodes.
           * Returns null if any unknown inline is found (caller should freeze the block).
           */
          function parseInlineChildren(childNodes) {
            const result = []
            for (const child of childNodes) {
              if (child.type === "JSXText") {
                const text = child.value
                  .replace(/\n\s*/g, " ")
                  .replace(/\s+/g, " ")
                if (text && text !== " ") {
                  result.push(
                    babel.types.objectExpression([
                      babel.types.objectProperty(
                        babel.types.identifier("text"),
                        babel.types.stringLiteral(text)
                      ),
                    ])
                  )
                }
                continue
              }

              if (child.type === "JSXExpressionContainer") {
                if (child.expression.type === "StringLiteral") {
                  result.push(
                    babel.types.objectExpression([
                      babel.types.objectProperty(
                        babel.types.identifier("text"),
                        babel.types.stringLiteral(child.expression.value)
                      ),
                    ])
                  )
                }
                // {" "} and other expressions: skip (they're whitespace hints)
                continue
              }

              // Only elements (strong, em, code, a) are handled below; skip fragments etc.
              if (child.type !== "JSXElement") continue

              const tagName = child.openingElement.name.name
              if (!tagName) continue

              // Editable inline marks: emit a Slate text leaf with bold/italic/code.
              if (
                tagName === "strong" ||
                tagName === "em" ||
                tagName === "code"
              ) {
                const innerText = getJSXTextContent(child.children)
                if (innerText !== null) {
                  const props = [
                    babel.types.objectProperty(
                      babel.types.identifier("text"),
                      babel.types.stringLiteral(innerText)
                    ),
                  ]
                  if (tagName === "strong") {
                    props.push(
                      babel.types.objectProperty(
                        babel.types.identifier("bold"),
                        babel.types.booleanLiteral(true)
                      )
                    )
                  } else if (tagName === "em") {
                    props.push(
                      babel.types.objectProperty(
                        babel.types.identifier("italic"),
                        babel.types.booleanLiteral(true)
                      )
                    )
                  } else if (tagName === "code") {
                    props.push(
                      babel.types.objectProperty(
                        babel.types.identifier("code"),
                        babel.types.booleanLiteral(true)
                      )
                    )
                  }
                  result.push(babel.types.objectExpression(props))
                  continue
                }
              }

              // Links become a Slate inline element with type, url, and children.
              if (tagName === "a") {
                const hrefAttr = child.openingElement.attributes.find(
                  (a) => a.type === "JSXAttribute" && a.name.name === "href"
                )
                const url =
                  hrefAttr && hrefAttr.value
                    ? hrefAttr.value.type === "StringLiteral"
                      ? hrefAttr.value.value
                      : ""
                    : ""
                const linkChildren = parseInlineChildren(child.children)
                // If link body has unknown inline (e.g. component), freeze whole block.
                if (linkChildren === null) return null

                result.push(
                  babel.types.objectExpression([
                    babel.types.objectProperty(
                      babel.types.identifier("type"),
                      babel.types.stringLiteral("link")
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("url"),
                      babel.types.stringLiteral(url)
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("children"),
                      babel.types.arrayExpression(linkChildren)
                    ),
                  ])
                )
                continue
              }

              // Unknown inline element — signal the whole block should be frozen
              return null
            }
            return result
          }

          /**
           * Extract plain text from JSX children; return null if any non-text (e.g. component) is present.
           */
          function getJSXTextContent(childNodes) {
            let text = ""
            for (const child of childNodes) {
              if (child.type === "JSXText") {
                text += child.value.replace(/\n\s*/g, " ").replace(/\s+/g, " ")
              } else if (child.type === "JSXExpressionContainer") {
                if (child.expression.type === "StringLiteral") {
                  text += child.expression.value
                } else {
                  // Non-string expression (e.g. variable) — can't flatten to text.
                  return null
                }
              } else {
                // JSX element inside — can't flatten to text.
                return null
              }
            }
            return text
          }

          /** Build a Slate void node placeholder for a frozen block (Demo, Code, etc.). */
          function makeFrozenNode(id) {
            return babel.types.objectExpression([
              babel.types.objectProperty(
                babel.types.identifier("type"),
                babel.types.stringLiteral("frozen")
              ),
              babel.types.objectProperty(
                babel.types.identifier("id"),
                babel.types.stringLiteral(id)
              ),
              babel.types.objectProperty(
                babel.types.identifier("children"),
                babel.types.arrayExpression([
                  babel.types.objectExpression([
                    babel.types.objectProperty(
                      babel.types.identifier("text"),
                      babel.types.stringLiteral("")
                    ),
                  ]),
                ])
              ),
            ])
          }

          /** Single empty text leaf; used for empty paragraphs and list items. */
          function makeEmptyChildren() {
            return [
              babel.types.objectExpression([
                babel.types.objectProperty(
                  babel.types.identifier("text"),
                  babel.types.stringLiteral("")
                ),
              ]),
            ]
          }

          /** Record this node as frozen: keep AST + source, push a frozen Slate node. */
          function freezeBlock(node) {
            const id = `f${frozenId++}`
            frozenElementsData.push({ id, node })
            frozenSourcesData.push({ id, source: getSource(node, code) })
            slateNodes.push(makeFrozenNode(id))
          }

          /**
           * Flatten <ul>/<ol> into a sequence of list-item Slate nodes with listType and depth.
           */
          function processListItems(listElement, listType, depth) {
            for (const child of listElement.children) {
              if (child.type === "JSXText") continue
              if (
                child.type !== "JSXElement" ||
                child.openingElement.name.name !== "li"
              ) {
                continue
              }

              const textChildren = []
              let nestedList = null

              for (const liChild of child.children) {
                if (
                  liChild.type === "JSXElement" &&
                  (liChild.openingElement.name.name === "ul" ||
                    liChild.openingElement.name.name === "ol")
                ) {
                  nestedList = liChild
                } else {
                  textChildren.push(liChild)
                }
              }

              const inlineResult = parseInlineChildren(textChildren)
              if (inlineResult === null) {
                // List item has unknown inline (e.g. <Component />); treat whole <li> as frozen.
                freezeBlock(child)
              } else {
                const childrenArr =
                  inlineResult.length > 0 ? inlineResult : makeEmptyChildren()

                slateNodes.push(
                  babel.types.objectExpression([
                    babel.types.objectProperty(
                      babel.types.identifier("type"),
                      babel.types.stringLiteral("list-item")
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("id"),
                      babel.types.stringLiteral(`b${blockId++}`)
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("listType"),
                      babel.types.stringLiteral(listType)
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("depth"),
                      babel.types.numericLiteral(depth)
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("children"),
                      babel.types.arrayExpression(childrenArr)
                    ),
                  ])
                )
              }

              if (nestedList) {
                const nestedType = nestedList.openingElement.name.name
                processListItems(nestedList, nestedType, depth + 1)
              }
            }
          }

          /**
           * Top-level loop: turn each Doc child into a Slate block or frozen node.
           */
          for (const child of children) {
            if (child.type === "JSXText") {
              // Lone text (not inside <p>) becomes a paragraph.
              const trimmed = child.value.trim()
              if (trimmed) {
                slateNodes.push(
                  babel.types.objectExpression([
                    babel.types.objectProperty(
                      babel.types.identifier("type"),
                      babel.types.stringLiteral("paragraph")
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("id"),
                      babel.types.stringLiteral(`b${blockId++}`)
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("children"),
                      babel.types.arrayExpression([
                        babel.types.objectExpression([
                          babel.types.objectProperty(
                            babel.types.identifier("text"),
                            babel.types.stringLiteral(trimmed)
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

            const tagName = child.openingElement.name.name

            // Member expression or other non-identifier (e.g. <Foo.Bar />); freeze.
            if (!tagName) {
              freezeBlock(child)
              continue
            }

            if (tagName === "p") {
              const inlineResult = parseInlineChildren(child.children)
              if (inlineResult === null) {
                freezeBlock(child)
              } else {
                const childrenArr =
                  inlineResult.length > 0 ? inlineResult : makeEmptyChildren()
                slateNodes.push(
                  babel.types.objectExpression([
                    babel.types.objectProperty(
                      babel.types.identifier("type"),
                      babel.types.stringLiteral("paragraph")
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("id"),
                      babel.types.stringLiteral(`b${blockId++}`)
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("children"),
                      babel.types.arrayExpression(childrenArr)
                    ),
                  ])
                )
              }
              continue
            }

            const headingMatch = tagName.match(/^h([1-6])$/)
            if (headingMatch) {
              const level = parseInt(headingMatch[1], 10)
              const inlineResult = parseInlineChildren(child.children)
              if (inlineResult === null) {
                freezeBlock(child)
              } else {
                const childrenArr =
                  inlineResult.length > 0 ? inlineResult : makeEmptyChildren()
                slateNodes.push(
                  babel.types.objectExpression([
                    babel.types.objectProperty(
                      babel.types.identifier("type"),
                      babel.types.stringLiteral("heading")
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("id"),
                      babel.types.stringLiteral(`b${blockId++}`)
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("level"),
                      babel.types.numericLiteral(level)
                    ),
                    babel.types.objectProperty(
                      babel.types.identifier("children"),
                      babel.types.arrayExpression(childrenArr)
                    ),
                  ])
                )
              }
              continue
            }

            if (tagName === "ul" || tagName === "ol") {
              processListItems(child, tagName, 0)
              continue
            }

            // Everything else (Demo, Code, img, unknown components) is frozen
            freezeBlock(child)
          }

          // Attach slateDocument prop
          openingElement.attributes.push(
            babel.types.jsxAttribute(
              babel.types.jsxIdentifier("slateDocument"),
              babel.types.jsxExpressionContainer(
                babel.types.arrayExpression(slateNodes)
              )
            )
          )

          // Attach frozenElements prop: { "f0": <Demo>...</Demo>, ... }
          if (frozenElementsData.length > 0) {
            openingElement.attributes.push(
              babel.types.jsxAttribute(
                babel.types.jsxIdentifier("frozenElements"),
                babel.types.jsxExpressionContainer(
                  babel.types.objectExpression(
                    frozenElementsData.map(({ id, node }) =>
                      babel.types.objectProperty(
                        babel.types.stringLiteral(id),
                        node
                      )
                    )
                  )
                )
              )
            )
          }

          // Attach frozenSources prop: { "f0": "<Demo>...</Demo>", ... }
          if (frozenSourcesData.length > 0) {
            openingElement.attributes.push(
              babel.types.jsxAttribute(
                babel.types.jsxIdentifier("frozenSources"),
                babel.types.jsxExpressionContainer(
                  babel.types.objectExpression(
                    frozenSourcesData.map(({ id, source }) =>
                      babel.types.objectProperty(
                        babel.types.stringLiteral(id),
                        babel.types.stringLiteral(source)
                      )
                    )
                  )
                )
              )
            )
          }
        },
      },
      nodePath.scope,
      nodePath.parentPath
    )
  })

  Demo.forEach(function processCodedocsDemo(nodePath) {
    if (nodePath.parentPath.node.type !== "JSXOpeningElement") return

    traverse(
      state.file.path.parent,
      {
        JSXIdentifier(path, state) {
          if (path.node.name !== "Demo") return
          if (path.parentPath.node.type !== "JSXOpeningElement") return

          const jsxElement = path.parentPath.parentPath.node

          if (jsxElement.type !== "JSXElement") return

          let source
          if (includeWrapperInSource) {
            source = getSource(jsxElement, code)
          } else {
            source = jsxElement.children
              .map((child) => {
                const childSource = getSource(child, code)
                const mockCallbacks = findMockCallbacks(child)
                return replaceMockCallbacks(
                  childSource,
                  child.start,
                  mockCallbacks
                )
              })
              .join("")
          }

          setSourceAttribute(jsxElement.openingElement, source)
          setDependencySourcesAttribute(jsxElement.openingElement)
        },
        JSXExpressionContainer(path, state) {
          if (!isDemoIdentifier(path.parentPath.parentPath)) return

          const demoIdentifier = path.parentPath.parentPath

          if (!isRenderAttribute(path.parentPath)) return

          const noWrapperInSource = demoIdentifier.node.attributes.find(
            (attr) =>
              attr.type === "JSXAttribute" &&
              attr.name.name === "noWrapperInSource"
          )

          let source
          if (includeWrapperInSource && !noWrapperInSource) {
            source = getSource(demoIdentifier.parentPath.node, code)
          } else {
            const expression = path.node.expression

            // Only process arrow functions and function expressions
            if (
              expression.type !== "ArrowFunctionExpression" &&
              expression.type !== "FunctionExpression"
            ) {
              // Skip non-function expressions (e.g., render={functionRef})
              return
            }

            const body = expression.body

            // Skip if body is undefined (shouldn't happen for functions, but be defensive)
            if (!body) {
              return
            }

            const bodySource = getSource(body, code)
            const mockCallbacks = findMockCallbacks(body)

            // Replace mock.callback("name") with just name
            if (body.type === "BlockStatement") {
              // For block statements like () => { return <div/> }, remove the braces
              const processedSource = bodySource
                .slice(1, bodySource.length - 1)
                .trim()
              const braceOffset = 1 // for the opening brace we sliced off
              const trimStart =
                bodySource.slice(1).length -
                bodySource.slice(1).trimStart().length
              source = replaceMockCallbacks(
                processedSource,
                body.start + braceOffset + trimStart,
                mockCallbacks
              )
            } else {
              // For concise arrow functions like () => <div/>, use as-is
              source = replaceMockCallbacks(
                bodySource,
                body.start,
                mockCallbacks
              )
            }
          }

          setSourceAttribute(demoIdentifier.node, source)
        },
      },
      nodePath.scope,
      nodePath.parentPath
    )
  })

  const specifierIdentifiers = []

  /**
   * SYNCME: Update this list when adding new exports
   */
  if (Demo.length > 0) {
    specifierIdentifiers.push("Demo")
  }
  if (Doc.length > 0) {
    specifierIdentifiers.push("Doc")
  }
  if (DocsApp.length > 0) {
    specifierIdentifiers.push("DocsApp")
  }
  if (Code.length > 0) {
    specifierIdentifiers.push("Code")
  }
  if (Placeholder.length > 0) {
    specifierIdentifiers.push("Placeholder")
  }
  if (Mockup.length > 0) {
    specifierIdentifiers.push("Mockup")
  }
  if (Component.length > 0) {
    specifierIdentifiers.push("Component")
  }

  const specifiers = specifierIdentifiers.map((identifier) =>
    babel.types.importSpecifier(
      babel.types.identifier(identifier),
      babel.types.identifier(identifier)
    )
  )

  const importSourceLiteral = babel.types.stringLiteral("codedocs")

  const newImport = babel.types.importDeclaration(
    specifiers,
    importSourceLiteral
  )

  const { program } = state.file.path.container

  program.body.unshift(newImport)
})

/**
 * Extracts the source code for a given AST node.
 * @param {object} node - The AST node with start and end positions
 * @param {string} code - The full source code string
 * @returns {string} The source code slice for this node
 */
function getSource(node, code) {
  const { start, end } = node
  return code.slice(start, end)
}

/**
 * Recursively finds all mock.callback("name") calls in a Babel AST node.
 * @param {object} node - The AST node to search within
 * @param {Array<{start: number, end: number, callbackName: string}>} results - Accumulator for found callbacks
 * @returns {Array<{start: number, end: number, callbackName: string}>} Array of mock callback info
 */
function findMockCallbacks(node, results = []) {
  if (!node || typeof node !== "object") return results

  // Check if this node is a mock.callback("...") call
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    node.callee.object?.type === "Identifier" &&
    node.callee.object.name === "mock" &&
    node.callee.property?.type === "Identifier" &&
    node.callee.property.name === "callback" &&
    node.arguments?.length === 1 &&
    node.arguments[0]?.type === "StringLiteral"
  ) {
    results.push({
      start: node.start,
      end: node.end,
      callbackName: node.arguments[0].value,
    })
  }

  // Recurse into child nodes
  for (const key in node) {
    if (key === "start" || key === "end" || key === "loc") continue
    const child = node[key]
    if (Array.isArray(child)) {
      child.forEach((item) => findMockCallbacks(item, results))
    } else if (child && typeof child === "object") {
      findMockCallbacks(child, results)
    }
  }

  return results
}

/**
 * Replaces mock.callback("name") calls with just the callback name in a source string.
 * Processes replacements from end to start to preserve character positions.
 * @param {string} source - The source code string to modify
 * @param {number} nodeStart - The start position of the source node in the original file
 * @param {Array<{start: number, end: number, callbackName: string}>} mockCallbacks - The callbacks to replace
 * @returns {string} The source with mock.callback calls replaced by their names
 */
function replaceMockCallbacks(source, nodeStart, mockCallbacks) {
  const sorted = [...mockCallbacks].sort((a, b) => b.start - a.start)

  let result = source
  for (const { start, end, callbackName } of sorted) {
    const relativeStart = start - nodeStart
    const relativeEnd = end - nodeStart
    result =
      result.slice(0, relativeStart) + callbackName + result.slice(relativeEnd)
  }
  return result
}

/**
 * Checks if a Babel path represents a "render" JSX attribute.
 * @param {object} path - The Babel path to check
 * @returns {boolean} True if this is a render attribute
 */
function isRenderAttribute(path) {
  if (path.node.name.type !== "JSXIdentifier") return false
  if (path.node.name.name !== "render") return false

  return true
}

/**
 * Checks if a Babel path represents a "Demo" JSX identifier.
 * @param {object} path - The Babel path to check
 * @returns {boolean} True if this is a Demo identifier
 */
function isDemoIdentifier(path) {
  if (!path.node.name) return false

  const { type, name } = path.node.name

  if (type !== "JSXIdentifier") return false
  if (name !== "Demo") return false

  return true
}

/**
 * Debug utility to log a JSON object with circular reference handling.
 * @param {string} name - Label for the logged output
 * @param {object} json - The object to stringify and log
 */
function dump(name, json) {
  var cache = []
  const str = JSON.stringify(
    json,
    (_, value) => {
      if (typeof value === "object" && value !== null) {
        if (cache.includes(value)) return "<circ>"
        cache.push(value)
      }
      return value
    },
    4
  )
  cache = null
  console.log(name, str)
}

/**
 * Debug utility to log a Babel path object, excluding circular/noisy properties.
 * @param {string} name - Label for the logged output
 * @param {object} path - The Babel path to dump
 */
function dumpPath(name, path) {
  const {
    scope,
    contexts,
    context,
    state: foo,
    parentPath,
    parent,
    container,
    opts,
    hub,
    ...rest
  } = path

  dump(name, rest)
}
