/**
 * Codedocs babel macro: transforms <Doc>, <Demo>, etc. at compile time.
 * Built to dist/macro.js; macro/index.js stub attaches component re-exports and loads this.
 */

import type { NodePath } from "@babel/traverse"
import type { MacroParams } from "babel-plugin-macros"
import { createMacro } from "babel-plugin-macros"
import { processDocNode } from "./helpers/processDocNode"

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

  Doc.forEach((nodePath: NodePath) => {
    processDocNode({
      nodePath,
      state,
      code,
      includeWrapper: includeWrapperInSource,
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
