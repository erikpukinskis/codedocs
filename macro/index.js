const { createMacro } = require("babel-plugin-macros")
const { default: traverse } = require("@babel/traverse")

module.exports = createMacro(function Demo({ references, state, babel }) {
  const {
    Demo = [],
    Doc = [],
    DocsApp = [],
    Code = [],
    Placeholder = [],
  } = references

  const code = state.file.code
  const includeWrapperInSource = code.startsWith(
    "// @codedocs include-wrapper-in-source"
  )

  function setSourceAttribute(node, source) {
    const newAttribute = babel.types.jsxAttribute(
      babel.types.jsxIdentifier("source"),
      babel.types.jsxExpressionContainer(
        babel.types.templateLiteral(
          [babel.types.templateElement({ raw: source }, true)],
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
        },
        JSXExpressionContainer(path, state) {
          if (!isDemoIdentifier(path.parentPath.parentPath)) return

          const demoIdentifier = path.parentPath.parentPath

          if (!isRenderAttribute(path.parentPath)) return

          let source
          if (includeWrapperInSource) {
            source = getSource(demoIdentifier.parentPath.node, code)
          } else {
            const body = path.node.expression.body
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
