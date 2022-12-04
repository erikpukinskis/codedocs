const { createMacro } = require("babel-plugin-macros")
import traverse from "@babel/traverse"

// `createMacro` is simply a function that ensures your macro is only
// called in the context of a babel transpilation and will throw an
// error with a helpful message if someone does not have babel-plugin-macros
// configured correctly
module.exports = createMacro(Demo)

function Demo({ references, state, babel }) {
  console.log("demo flurbls!")

  const { Demo = [] } = references

  Demo.forEach(function processCodedocsDemo(nodePath) {
    dump("NODE_PATH", nodePath)

    const fileCode =
      state.references.parentPath.parentPath.parentPath.parentPath.contexts[0]
        .scope.bindings.Doc.path.parentPath.contexts.queue[0].hub.file.code

    let source

    traverse(ast, {
      enter(path) {
        renderFunctionNode = getRenderFunction(path)
        if (!renderFunctionNode) return
        source = fileCode.slice(
          renderFunctionNode.start,
          renderFunctionNode.end
        )
      },
    })

    if (renderFunctionNode) {
      babel.setProperty(renderFunctionNode.parentPath.props, "source", source)
    }
  })

  // state is the second argument you're passed to a visitor in a
  // normal babel plugin. `babel` is the `babel-plugin-macros` module.
  // do whatever you like to the AST paths you find in `references`
  // read more below...
}

function getRenderFunction(path) {
  // init.openingElement
  //   .name
  //     "type": "JSXIdentifier",
  //     "name": "DemoMacro"

  //   .attributes[0].name.name === "render"
  //   .value
  //     "type": "JSXExpressionContainer",
  //     .expression.body
  //       "type": "JSXFragment",
  //       .start
  //       .end

  if (!path.isIdentifier({ name: "JSXExpressionContainer" })) return

  const body = path.expression.body

  if (!body.isIdentifier({ name: "JSXExpressionContainer" })) return

  return body
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
