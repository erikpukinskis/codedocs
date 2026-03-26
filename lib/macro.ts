/**
 * Codedocs babel macro: transforms <Doc>, <Demo>, etc. at compile time.
 * Built to dist/macro.js; macro/index.js stub attaches component re-exports and loads this.
 */

import type { NodePath } from "@babel/traverse"
import {
  type JSXAttribute,
  type JSXOpeningElement,
  type ObjectProperty,
} from "@babel/types"
import type { MacroParams } from "babel-plugin-macros"
import { createMacro } from "babel-plugin-macros"
import { isNamedJSXAttribute } from "./helpers/babelJsxGuards"
import { formatTypescript } from "./helpers/formatTypeScript"
import { processDemoNode } from "./helpers/processDemoNode"
import { processDocNode } from "./helpers/processDocNode"

function getSource(
  node: { start?: number | null; end?: number | null },
  code: string
): string {
  const start = node.start ?? 0
  const end = node.end ?? code.length
  return code.slice(start, end)
}

/**
 * Detection & type guard conventions for this macro
 * —————————————————————————————————————————————————
 *
 * Prefer `@babel/types` predicates (`isJSXElement`, `isBlockStatement`, etc.)
 * over ad hoc `node.type === "…"` checks so TypeScript narrows correctly.
 *
 * Add local helpers (e.g. `isNamedJSXElement`, `isNamedJSXAttribute`) when the
 * same shape is checked in more than one place, or when one guard bundles
 * several assertions about the same node (tag name + JSX shape).
 *
 * In type guards, chain conditions with `if` / `else if` / `else` and return
 * booleans from each branch; keep each assertion on its own single line (one
 * check per `else if`).
 *
 * Avoid extra null checks: `isX(foo?.bar)` should receive undefined if foo is
 * null, and return false.
 */

export default createMacro(function codedocsMacro({
  references,
  state,
  babel,
}: MacroParams) {
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

  function setSourceAttribute(node: JSXOpeningElement, source: string): void {
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
      (attribute) => isNamedJSXAttribute(attribute, "source")
    )

    if (existingSourceAttributeIndex >= 0) {
      node.attributes[existingSourceAttributeIndex] = newAttribute
    } else {
      node.attributes.push(newAttribute)
    }
  }

  function setDependencySourcesAttribute(
    openingElement: JSXOpeningElement
  ): void {
    const dependenciesAttr = openingElement.attributes.find(
      (attr): attr is JSXAttribute =>
        isNamedJSXAttribute(attr, "dependencies") &&
        attr.value?.type === "JSXExpressionContainer"
    )

    if (
      !dependenciesAttr?.value ||
      dependenciesAttr.value.type !== "JSXExpressionContainer"
    )
      return

    const objExpr = dependenciesAttr.value.expression
    if (objExpr.type !== "ObjectExpression") return

    const dependencySourcesProperties = objExpr.properties
      .filter((prop): prop is ObjectProperty => prop.type === "ObjectProperty")
      .map((prop: ObjectProperty) => {
        const keyName =
          prop.key.type === "Identifier"
            ? prop.key.name
            : (prop.key as { value: string }).value
        const valueSource = getSource(
          prop.value as { start?: number | null; end?: number | null },
          code
        )
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

    const alreadyHasDependencySources = openingElement.attributes.some((attr) =>
      isNamedJSXAttribute(attr, "dependencySources")
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

  Doc.forEach((nodePath: NodePath) => {
    processDocNode({ nodePath, state, code, getSource })
  })

  Demo.forEach((nodePath: NodePath) => {
    processDemoNode({
      nodePath,
      state,
      code,
      includeWrapperInSource,
      getSource,
      setSourceAttribute,
      setDependencySourcesAttribute,
    })
  })

  const specifierIdentifiers: string[] = []

  if (Demo.length > 0) specifierIdentifiers.push("Demo")
  if (Doc.length > 0) specifierIdentifiers.push("Doc")
  if (DocsApp.length > 0) specifierIdentifiers.push("DocsApp")
  if (Code.length > 0) specifierIdentifiers.push("Code")
  if (Placeholder.length > 0) specifierIdentifiers.push("Placeholder")
  if (Mockup.length > 0) specifierIdentifiers.push("Mockup")
  if (Component.length > 0) specifierIdentifiers.push("Component")

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

  state.file.path.node.body.unshift(newImport)
})
