/**
 * Codedocs babel macro: transforms <Doc>, <Demo>, etc. at compile time.
 * Built to dist/macro.js; macro/index.js stub attaches component re-exports and loads this.
 */

import traverse from "@babel/traverse"
import type { NodePath } from "@babel/traverse"
import {
  isJSXAttribute,
  isJSXElement,
  isJSXOpeningElement,
  type CallExpression,
  type JSXAttribute,
  type JSXElement,
  type JSXExpressionContainer,
  type JSXOpeningElement,
  type Node,
  type ObjectProperty,
  type StringLiteral,
} from "@babel/types"
import type { MacroParams } from "babel-plugin-macros"
import { createMacro } from "babel-plugin-macros"
import prettier from "prettier"
import parserTypescript from "prettier/parser-typescript"
import { processDocNode } from "./helpers/processDocNode"

function formatTypescript(source: string): string {
  try {
    let sourceToFormat = source
    let wrappedInFragment = false

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

    if (wrappedInFragment) {
      return formatted.slice(2, -3).trim()
    }

    return formatted
  } catch {
    return source
  }
}

function getSource(
  node: { start?: number | null; end?: number | null },
  code: string
): string {
  const start = node.start ?? 0
  const end = node.end ?? code.length
  return code.slice(start, end)
}

interface MockCallback {
  start: number
  end: number
  callbackName: string
}

/** `mock.callback("name")` with positions, for stripping displayed demo source. */
type MockCallbackCall = CallExpression & {
  start: number
  end: number
  arguments: [StringLiteral]
}

function isMockCallbackNode(node: Node): node is MockCallbackCall {
  if (node.type !== "CallExpression") return false
  else if (node.start == null || node.end == null) return false
  else if (node.arguments.length !== 1) return false
  else if (node.arguments[0].type !== "StringLiteral") return false

  const { callee } = node

  if (callee.type !== "MemberExpression") return false
  else if (callee.object?.type !== "Identifier") return false
  else if (callee.object?.name !== "mock") return false
  else if (callee.property.type !== "Identifier") return false
  else if (callee.property.name !== "callback") return false
  else return true
}

function findMockCallbacks(
  node: Node | null | undefined,
  results: MockCallback[] = []
): MockCallback[] {
  if (!node || typeof node !== "object") return results

  if (isMockCallbackNode(node)) {
    results.push({
      start: node.start,
      end: node.end,
      callbackName: node.arguments[0].value,
    })
  }

  const nodeObj = node as unknown as Record<string, unknown>
  for (const key in nodeObj) {
    if (key === "start" || key === "end" || key === "loc") continue
    const child = nodeObj[key]
    if (Array.isArray(child)) {
      child.forEach((item: Node) => findMockCallbacks(item, results))
    } else if (child && typeof child === "object") {
      findMockCallbacks(child as Node, results)
    }
  }

  return results
}

function replaceMockCallbacks(
  source: string,
  nodeStart: number,
  mockCallbacks: MockCallback[]
): string {
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

function isRenderAttribute(
  path: NodePath | null | undefined
): path is NodePath<JSXAttribute> {
  if (path == null) return false
  else if (!isJSXAttribute(path.node)) return false
  else
    return (
      path.node.name.type === "JSXIdentifier" &&
      path.node.name.name === "render"
    )
}

function isDemoElement(
  path: NodePath | null | undefined
): path is NodePath<JSXElement> {
  if (path == null) return false
  else if (!isJSXElement(path.node)) return false
  else if (!path.node.openingElement) return false
  return (
    path.node.openingElement.name.type === "JSXIdentifier" &&
    path.node.openingElement.name.name === "Demo"
  )
}

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
      (attribute): attribute is JSXAttribute =>
        attribute.type === "JSXAttribute" &&
        attribute.name.type === "JSXIdentifier" &&
        attribute.name.name === "source"
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
        attr.type === "JSXAttribute" &&
        attr.name.type === "JSXIdentifier" &&
        attr.name.name === "dependencies" &&
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

    const alreadyHasDependencySources = openingElement.attributes.some(
      (attr) =>
        attr.type === "JSXAttribute" &&
        attr.name.type === "JSXIdentifier" &&
        attr.name.name === "dependencySources"
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
    if (
      !nodePath.parentPath ||
      nodePath.parentPath.node.type !== "JSXOpeningElement"
    )
      return

    traverse(
      state.file.path.parent,
      {
        JSXIdentifier(path: NodePath) {
          if (path.node.type !== "JSXIdentifier" || path.node.name !== "Demo")
            return
          const parentPath = path.parentPath
          if (!parentPath || parentPath.node.type !== "JSXOpeningElement")
            return

          const grandPath = parentPath.parentPath
          if (!grandPath) return
          const jsxElement = grandPath.node

          if (jsxElement.type !== "JSXElement") return

          let source: string
          if (includeWrapperInSource) {
            source = getSource(jsxElement, code)
          } else {
            source = jsxElement.children
              .map((child: JSXElement["children"][number]) => {
                const childSource = getSource(child, code)
                const mockCallbacks = findMockCallbacks(child as Node)
                return replaceMockCallbacks(
                  childSource,
                  child.start ?? 0,
                  mockCallbacks
                )
              })
              .join("")
          }

          setSourceAttribute(jsxElement.openingElement, source)
          setDependencySourcesAttribute(jsxElement.openingElement)
        },
        JSXExpressionContainer(path: NodePath<JSXExpressionContainer>) {
          const attrPath = path.parentPath
          if (!isRenderAttribute(attrPath)) return

          const openingPath = attrPath.parentPath
          if (!isJSXOpeningElement(openingPath?.node)) return

          const demoPath = openingPath.parentPath
          if (!isDemoElement(demoPath)) return

          const noWrapperInSource =
            demoPath.node.openingElement.attributes.find(
              (attr) =>
                attr.type === "JSXAttribute" &&
                attr.name.type === "JSXIdentifier" &&
                attr.name.name === "noWrapperInSource"
            )

          let source: string
          if (includeWrapperInSource && !noWrapperInSource) {
            source = getSource(demoPath.node, code)
          } else {
            const expression = path.node.expression

            if (
              expression.type !== "ArrowFunctionExpression" &&
              expression.type !== "FunctionExpression"
            ) {
              return
            }

            const body = expression.body
            if (!body) return

            const bodySource = getSource(body, code)
            const mockCallbacks = findMockCallbacks(body)

            if (body.type === "BlockStatement") {
              const processedSource = bodySource
                .slice(1, bodySource.length - 1)
                .trim()
              const braceOffset = 1
              const trimStart =
                bodySource.slice(1).length -
                bodySource.slice(1).trimStart().length
              const bodyStart = body.start ?? 0
              source = replaceMockCallbacks(
                processedSource,
                bodyStart + braceOffset + trimStart,
                mockCallbacks
              )
            } else {
              source = replaceMockCallbacks(
                bodySource,
                body.start ?? 0,
                mockCallbacks
              )
            }
          }

          setSourceAttribute(demoPath.node.openingElement, source)
        },
      },
      nodePath.scope,
      nodePath.parentPath
    )
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
