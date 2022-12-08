const { createMacro } = require("babel-plugin-macros")
const { default: traverse } = require("@babel/traverse")
const { rest } = require("lodash")
const { faBaby } = require("@fortawesome/free-solid-svg-icons")
const printAST = require("ast-pretty-print")

// `createMacro` is simply a function that ensures your macro is only
// called in the context of a babel transpilation and will throw an
// error with a helpful message if someone does not have babel-plugin-macros
// configured correctly
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
          if (!isDemoIdentifier(path.parentPath.parentPath)) {
            return
          }

          const demoIdentifier = path.parentPath.parentPath

          if (!isRenderAttribute(path.parentPath)) {
            console.log("Demo identifier but not render attribute!")
            return
          }

          // dumpPath("GRANDPA", path.parentPath.parentPath)
          // dumpPath("PA", path.parentPath)

          const source = path.node.expression.body.body
            .map(getSource)
            .join("\n")
          // console.log("SOURCE", source)

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

  // state is the second argument you're passed to a visitor in a
  // normal babel plugin. `babel` is the `babel-plugin-macros` module.
  // do whatever you like to the AST paths you find in `references`
  // read more below...
})

function isRenderAttribute(path) {
  if (path.node.name.type !== "JSXIdentifier") {
    // console.log("not a JSXIdentifier node")
    return
  }

  if (path.node.name.name !== "render") {
    // console.log("Not a render attribute")
    return
  }

  return true
}

function isDemoIdentifier(path) {
  const { type, name, loc } = path.node.name

  if (type !== "JSXIdentifier") {
    // console.log("not a JSXIdentifier node")
    return false
  }
  if (name !== "Demo") {
    // console.log("no Demo")
    return false
  }

  const { line, column } = loc.start

  // console.log("Grandpa is a <Demo>!", "line", line, "column", column)
  return true
}

function dump(name, json) {
  // Note: cache should not be re-used by repeated calls to JSON.stringify.
  var cache = []
  const str = JSON.stringify(
    json,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        // Duplicate reference found, discard key
        if (cache.includes(value)) return "<circ>"

        // Store value in our collection
        cache.push(value)
      }
      return value
    },
    4
  )
  cache = null // Enable garbage collection
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
