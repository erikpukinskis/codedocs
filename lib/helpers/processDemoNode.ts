import type { PluginPass } from "@babel/core"
import traverse from "@babel/traverse"
import type { NodePath } from "@babel/traverse"
import {
  isBlockStatement,
  isJSXOpeningElement,
  type JSXElement,
  type JSXExpressionContainer,
  type JSXOpeningElement,
  type Node,
} from "@babel/types"
import {
  isMockCallbackNode,
  isNamedJSXAttribute,
  isNamedJSXElement,
  type MockCallbackCall,
} from "./babelJsxGuards"
import type { GetSource } from "./processDocNode"

function findMockCallbacks(
  node: Node | null | undefined,
  results: MockCallbackCall[] = []
): MockCallbackCall[] {
  if (!node || typeof node !== "object") return results

  if (isMockCallbackNode(node)) {
    results.push(node)
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
  mockCallbacks: MockCallbackCall[]
): string {
  const sorted = [...mockCallbacks].sort((a, b) => b.start - a.start)

  let result = source
  for (const call of sorted) {
    const callbackName = call.arguments[0].value
    const relativeStart = call.start - nodeStart
    const relativeEnd = call.end - nodeStart
    result =
      result.slice(0, relativeStart) + callbackName + result.slice(relativeEnd)
  }
  return result
}

export interface ProcessDemoNodeParams {
  nodePath: NodePath
  state: PluginPass
  code: string
  includeWrapperInSource: boolean
  getSource: GetSource
  setSourceAttribute: (node: JSXOpeningElement, source: string) => void
  setDependencySourcesAttribute: (openingElement: JSXOpeningElement) => void
}

/**
 * For each <Demo> reference: walk JSX and attach `source` / `dependencySources`
 * props from the demo body or render callback.
 */
export function processDemoNode({
  nodePath,
  state,
  code,
  includeWrapperInSource,
  getSource,
  setSourceAttribute,
  setDependencySourcesAttribute,
}: ProcessDemoNodeParams): void {
  if (!nodePath.parentPath || !isJSXOpeningElement(nodePath.parentPath.node))
    return

  traverse(
    state.file.path.parent,
    {
      JSXIdentifier(path: NodePath) {
        const parentPath = path.parentPath
        if (!parentPath || !isJSXOpeningElement(parentPath.node)) return

        const grandPath = parentPath.parentPath
        if (!grandPath || !isNamedJSXElement(grandPath.node, "Demo")) return

        const jsxElement = grandPath.node

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
        if (!isNamedJSXAttribute(attrPath?.node, "render")) return

        const openingPath = attrPath.parentPath
        if (!openingPath || !isJSXOpeningElement(openingPath.node)) return

        const demoPath = openingPath.parentPath
        if (!demoPath || !isNamedJSXElement(demoPath?.node, "Demo")) return

        const noWrapperInSource = demoPath.node.openingElement.attributes.find(
          (attr) => isNamedJSXAttribute(attr, "noWrapperInSource")
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

          if (isBlockStatement(body)) {
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
}
