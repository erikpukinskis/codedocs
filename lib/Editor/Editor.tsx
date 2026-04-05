import React, { useCallback, useRef, useState } from "react"
import { createEditor, Editor, Range, Transforms } from "slate"
import type { Element as SlateElement } from "slate"
import { withHistory, type HistoryEditor } from "slate-history"
import { Editable, ReactEditor, Slate, withReact, useSlate } from "slate-react"
import type { RenderElementProps } from "slate-react"
import { copyHtml, copyPlainText } from "./copy"
import * as styles from "./Editor.css"
import { isLineOfCodeElement, isListItemBlock, type SlateBlock } from "./types"

type DocEditorProps = {
  slateDocument: SlateElement[]
  frozenElements: Record<string, React.ReactNode>
}

export const DocEditor = ({
  slateDocument,
  frozenElements,
}: DocEditorProps) => {
  // Lazy ref so the same editor instance survives Fast Refresh / re-renders; useMemo
  // would recreate when this module hot-reloads.
  const editorRef = useRef<(ReactEditor & HistoryEditor) | null>(null)
  if (editorRef.current === null) {
    const editor = withHistory(withReact(createEditor()))

    const defaultSetFragmentData = editor.setFragmentData.bind(editor)

    editor.setFragmentData = (data: DataTransfer) => {
      // Still set application/x-slate-fragment, text/html, etc. from Slate.
      defaultSetFragmentData(data)
      const { selection } = editor
      if (!selection || Range.isCollapsed(selection)) return
      // Always derive text/plain from the document (see clipboardPlainTextForRange).
      const text = copyPlainText(editor, selection)
      const html = copyHtml(editor, selection)
      data.setData("text/plain", text)
      data.setData("text/html", html)

      // const fragment = Editor.fragment(editor, selection)
      // const slateMime = data.getData("application/x-slate-fragment")
      console.debug("Copied HTML to clipboard:")
      console.debug(html)
    }

    editorRef.current = editor
  }
  const editor = editorRef.current
  const [value, setValue] = useState(slateDocument)

  const renderElement = useCallback(
    (props: RenderElementProps) => (
      <DocElement {...props} frozenElements={frozenElements} />
    ),
    [frozenElements]
  )

  const renderLeaf = useCallback(
    (props: {
      attributes: Record<string, unknown>
      children: React.ReactNode
      leaf: { text: string; bold?: boolean; italic?: boolean; code?: boolean }
    }) => {
      let { children: leafChildren } = props
      if (props.leaf.bold) leafChildren = <strong>{leafChildren}</strong>
      if (props.leaf.italic) leafChildren = <em>{leafChildren}</em>
      if (props.leaf.code) leafChildren = <code>{leafChildren}</code>
      return <span {...props.attributes}>{leafChildren}</span>
    },
    []
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault()
        editor.insertText("\n")
        return
      }

      const [codeLineMatch] = Editor.nodes(editor, {
        match: isLineOfCodeElement,
      })

      if (event.key === "Enter" && codeLineMatch) {
        event.preventDefault()
        const [codeLine, codeLinePath] = codeLineMatch
        const codeLineNode = codeLine

        const lineText = codeLineNode.children
          .map((c) => ("text" in c ? c.text : ""))
          .join("")

        const leadingWhitespace = lineText.match(/^\s*/)?.[0] ?? ""

        const codeBlockPath = codeLinePath.slice(0, -1)
        const [codeBlockNode] = Editor.node(editor, codeBlockPath)
        // TODO: Use Zod for this when we migrate the types to Zod
        const codeBlock = codeBlockNode as SlateBlock

        const isLastLine =
          codeLinePath[codeLinePath.length - 1] ===
          codeBlock.children.length - 1
        const isEmpty = lineText.trim() === ""

        if (isEmpty && isLastLine) {
          Transforms.removeNodes(editor, { at: codeLinePath })
          Transforms.insertNodes(
            editor,
            {
              type: "paragraph",
              id: `b${Date.now()}`,
              children: [{ text: "" }],
            } as SlateBlock, // TODO: Zod
            { at: [codeBlockPath[0] + 1] }
          )
          Transforms.select(editor, [codeBlockPath[0] + 1, 0])
        } else {
          const anchor = editor.selection?.anchor
          if (!anchor) return

          // TODO: Zod
          const emptyLine = {
            type: "code-line",
            language: codeLineNode.language,
            children: [{ text: "" }],
          } as SlateBlock

          const lineIndex = codeLinePath[codeLinePath.length - 1]

          if (Editor.isStart(editor, anchor, codeLinePath)) {
            Transforms.insertNodes(editor, emptyLine, { at: codeLinePath })
            const shiftedLinePath = [
              ...codeLinePath.slice(0, -1),
              lineIndex + 1,
            ]
            Transforms.select(editor, {
              path: [...shiftedLinePath, 0],
              offset: 0,
            })
          } else if (Editor.isEnd(editor, anchor, codeLinePath)) {
            const newLinePath = [...codeLinePath.slice(0, -1), lineIndex + 1]
            Transforms.insertNodes(editor, emptyLine, { at: newLinePath })
            Transforms.select(editor, {
              path: [...newLinePath, 0],
              offset: 0,
            })
          } else {
            Transforms.splitNodes(editor, { at: anchor })
            const newLinePath = [...codeLinePath.slice(0, -1), lineIndex + 1]
            const [newLineNode] = Editor.node(editor, newLinePath)
            // TODO: Parse with Zod, also is this a new node type? Or a ParagraphBlock?
            const newLine = newLineNode as SlateBlock
            const newLineText = newLine.children
              .map((c) => ("text" in c ? c.text : ""))
              .join("")

            if (!newLineText.startsWith(leadingWhitespace)) {
              Transforms.insertText(editor, leadingWhitespace, {
                at: {
                  path: [...newLinePath, 0],
                  offset: 0,
                },
              })
            }
          }
        }
        return
      }

      if (event.key === "Tab" && codeLineMatch) {
        event.preventDefault()

        if (editor.selection && Range.isCollapsed(editor.selection)) {
          const offset = editor.selection.anchor.offset
          const spacesToInsert = 2 - (offset % 2)
          editor.insertText(" ".repeat(spacesToInsert))
        } else {
          if (!editor.selection) {
            throw new Error("No selection?")
          }
          const [start, end] = Editor.edges(editor, editor.selection)
          const startCodeLinePath = Editor.above(editor, {
            at: start,
            match: isLineOfCodeElement,
          })?.[1]
          const endCodeLinePath = Editor.above(editor, {
            at: end,
            match: isLineOfCodeElement,
          })?.[1]

          if (startCodeLinePath && endCodeLinePath) {
            const startLineIndex =
              startCodeLinePath[startCodeLinePath.length - 1]
            const endLineIndex = endCodeLinePath[endCodeLinePath.length - 1]

            for (let i = startLineIndex; i <= endLineIndex; i++) {
              const linePath = [...startCodeLinePath.slice(0, -1), i]
              const [lineNode] = Editor.node(editor, linePath)
              // TODO: Zod
              const line = lineNode as SlateBlock
              const lineText = line.children
                .map((c) => ("text" in c ? c.text : ""))
                .join("")

              if (event.shiftKey) {
                const match = lineText.match(/^( {1,2})/)
                if (match) {
                  const spacesToRemove = match[1].length
                  Transforms.delete(editor, {
                    at: {
                      anchor: { path: [...linePath, 0], offset: 0 },
                      focus: {
                        path: [...linePath, 0],
                        offset: spacesToRemove,
                      },
                    },
                  })
                }
              } else {
                Transforms.insertText(editor, "  ", {
                  at: { path: [...linePath, 0], offset: 0 },
                })
              }
            }
          }
        }
        return
      }

      if (event.key === "Tab") {
        event.preventDefault()
        const [match] = Editor.nodes(editor, {
          match: isListItemBlock,
        })
        if (match) {
          const [node, path] = match
          const currentDepth = node.depth ?? 0
          const newDepth = event.shiftKey
            ? Math.max(0, currentDepth - 1)
            : Math.min(6, currentDepth + 1)
          Transforms.setNodes(
            editor,
            { depth: newDepth } as Partial<SlateBlock>,
            { at: path }
          )
        }
      }
    },
    [editor]
  )

  return (
    <div className={styles.editorContainer}>
      <Slate
        editor={editor}
        initialValue={value}
        onChange={(descendants) => {
          // Descendant is a union of Element and Text, but Slate will never put
          // text nodes at the root level, so this cast is safe:
          setValue(descendants as SlateBlock[])
        }}
      >
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
          placeholder="Start writing..."
          className={styles.editor}
        />
      </Slate>
    </div>
  )
}

const CodeLineElement = ({
  attributes,
  element,
  children,
}: {
  attributes: Record<string, unknown>
  element: SlateBlock
  children: React.ReactNode
}) => {
  const editor = useSlate()
  const path = ReactEditor.findPath(editor, element)
  const lineIndex = path[path.length - 1]

  return (
    <div {...attributes} className={styles.codeLine}>
      <span className={styles.lineNumber} contentEditable={false}>
        {lineIndex + 1}
      </span>
      {children}
    </div>
  )
}

type DocElementProps = RenderElementProps & {
  frozenElements: Record<string, React.ReactNode>
}

const DocElement = ({
  attributes,
  children,
  element,
  frozenElements,
}: DocElementProps) => {
  const node = element

  switch (node.type) {
    case "heading": {
      const level = node.level ?? 1
      if (level === 1) return <h1 {...attributes}>{children}</h1>
      if (level === 2) return <h2 {...attributes}>{children}</h2>
      if (level === 3) return <h3 {...attributes}>{children}</h3>
      if (level === 4) return <h4 {...attributes}>{children}</h4>
      if (level === 5) return <h5 {...attributes}>{children}</h5>
      return <h6 {...attributes}>{children}</h6>
    }
    case "code-block":
      return (
        <pre {...attributes} className={styles.codeBlock}>
          {children}
        </pre>
      )
    case "code-line":
      return (
        <CodeLineElement attributes={attributes} element={node}>
          {children}
        </CodeLineElement>
      )
    case "list-item": {
      const marginLeft = (node.depth ?? 0) * 24
      return (
        <div
          {...attributes}
          style={{
            marginLeft,
            display: "list-item",
            listStyleType: node.listType === "ol" ? "decimal" : "disc",
          }}
        >
          {children}
        </div>
      )
    }
    case "link":
      return (
        <a {...attributes} href={node.url}>
          {children}
        </a>
      )
    case "frozen": {
      // TODO: Have a selected state when the cursor is over a frozen block
      const frozenContent = node.id ? frozenElements[node.id] : null
      return (
        <div
          {...attributes}
          data-description="frozen block"
          contentEditable={false}
          className={styles.frozenBlock}
        >
          {frozenContent}
          {children}
        </div>
      )
    }
    case "paragraph":
    default:
      return <p {...attributes}>{children}</p>
  }
}
