const { createMacro } = require("babel-plugin-macros")
const { default: traverse } = require("@babel/traverse")

module.exports = createMacro(function Demo({ references, state, babel }) {
  const { Demo = [], Doc = [], DocsApp = [] } = references

  // dump("STATE", state)

  function getSource(node) {
    const { start, end } = node

    return state.file.code.slice(start, end)
  }

  function buildSourceAttribute(source) {
    return babel.types.jsxAttribute(
      babel.types.jsxIdentifier("source"),
      babel.types.jsxExpressionContainer(
        babel.types.templateLiteral(
          [babel.types.templateElement({ raw: source }, true)],
          []
        )
      )
    )
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

          const source = jsxElement.children.map(getSource).join("")

          jsxElement.openingElement.attributes.push(
            buildSourceAttribute(source)
          )
        },
        JSXExpressionContainer(path, state) {
          if (!isDemoIdentifier(path.parentPath.parentPath)) return

          const demoIdentifier = path.parentPath.parentPath

          if (!isRenderAttribute(path.parentPath)) return

          const bodySource = getSource(path.node.expression.body)
          const source = bodySource.slice(1, bodySource.length - 2)

          demoIdentifier.node.attributes.push(buildSourceAttribute(source))
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

function isRenderAttribute(path) {
  if (path.node.name.type !== "JSXIdentifier") return false
  if (path.node.name.name !== "render") return false

  return true
}

function isDemoIdentifier(path) {
  const { type, name } = path.node.name

  if (type !== "JSXIdentifier") return false
  if (name !== "Demo") return false

  return true
}

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
