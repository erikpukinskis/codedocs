import React, { useCallback, useRef, useState } from "react"
import { createEditor, Editor, Range, Text, Transforms } from "slate"
import type { Element as SlateElement, NodeEntry } from "slate"
import { withHistory, type HistoryEditor } from "slate-history"
import { Editable, ReactEditor, Slate, withReact, useSlate } from "slate-react"
import type { RenderElementProps, RenderLeafProps } from "slate-react"
import { copyHtml, copyPlainText } from "./copy"
import * as styles from "./Editor.css"
import { EditorToolbarArea } from "./EditorToolbarArea"
import {
  isLineOfCodeElement,
  isLinkElement,
  isListItemBlock,
  type SlateBlock,
} from "./types"

type DocEditorProps = {
  slateDocument: SlateElement[]
  frozenElements: Record<string, React.ReactNode>
  frozenSources?: Record<string, string>
}

export const DocEditor = ({
  slateDocument,
  frozenElements,
  frozenSources,
}: DocEditorProps) => {
  const frozenSourcesRef = useRef(frozenSources)
  frozenSourcesRef.current = frozenSources

  // Lazy ref so the same editor instance survives Fast Refresh / re-renders; useMemo
  // would recreate when this module hot-reloads.
  const editorRef = useRef<(ReactEditor & HistoryEditor) | null>(null)
  if (editorRef.current === null) {
    const editor = withHistory(withReact(createEditor()))
    editor.isInline = (element) => isLinkElement(element)

    const defaultSetFragmentData = editor.setFragmentData.bind(editor)

    editor.setFragmentData = (data: DataTransfer) => {
      // Still set application/x-slate-fragment, text/html, etc. from Slate.
      defaultSetFragmentData(data)
      const { selection } = editor
      if (!selection || Range.isCollapsed(selection)) return
      // Always derive text/plain from the document (see clipboardPlainTextForRange).
      const text = copyPlainText(editor, selection, frozenSourcesRef.current)
      const html = copyHtml(editor, selection, frozenSourcesRef.current)
      data.setData("text/plain", text)
      data.setData("text/html", html)

      // const fragment = Editor.fragment(editor, selection)
      // const slateMime = data.getData("application/x-slate-fragment")
      // console.debug("Copied HTML to clipboard:")
      // console.debug(html)
    }

    editorRef.current = editor
  }
  const editor = editorRef.current
  const [value, setValue] = useState(slateDocument)
  const [ghostSelection, setGhostSelection] = useState<Range | undefined>()
  const [isFocused, setIsFocused] = useState(false)

  const renderElement = useCallback(
    (props: RenderElementProps) => (
      <DocElement {...props} frozenElements={frozenElements} />
    ),
    [frozenElements]
  )

  const renderLeaf = useCallback(
    (
      props: Omit<RenderLeafProps, "children"> & { children: React.ReactNode }
    ) => {
      let { children: leafChildren } = props
      if (props.leaf.code) leafChildren = <code>{leafChildren}</code>
      if (props.leaf.strikethrough) leafChildren = <s>{leafChildren}</s>
      if (props.leaf.underline) leafChildren = <u>{leafChildren}</u>
      if (props.leaf.bold) leafChildren = <strong>{leafChildren}</strong>
      if (props.leaf.italic) leafChildren = <em>{leafChildren}</em>
      return (
        <span
          {...props.attributes}
          className={
            props.leaf.ghostSelection ? styles.ghostSelection : undefined
          }
        >
          {leafChildren}
        </span>
      )
    },
    []
  )

  const decorate = useCallback(
    ([node, path]: NodeEntry): Range[] => {
      if (isFocused || !ghostSelection || !Text.isText(node)) return []

      try {
        const intersection = Range.intersection(
          ghostSelection,
          Editor.range(editor, path)
        )
        if (!intersection) return []
        return [{ ...intersection, ghostSelection: true } as Range]
      } catch {
        return []
      }
    },
    [editor, ghostSelection, isFocused]
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

        const lineIdx = codeLinePath[codeLinePath.length - 1]
        const codeBlockIndex = codeBlockPath[0]
        if (lineIdx === undefined || codeBlockIndex === undefined) {
          return
        }

        const isLastLine = lineIdx === codeBlock.children.length - 1
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
            { at: [codeBlockIndex + 1] }
          )
          Transforms.select(editor, [codeBlockIndex + 1, 0])
        } else {
          const anchor = editor.selection?.anchor
          if (!anchor) return

          // TODO: Zod
          const emptyLine = {
            type: "code-line",
            language: codeLineNode.language,
            children: [{ text: "" }],
          } as SlateBlock

          if (Editor.isStart(editor, anchor, codeLinePath)) {
            Transforms.insertNodes(editor, emptyLine, { at: codeLinePath })
            const shiftedLinePath = [...codeLinePath.slice(0, -1), lineIdx + 1]
            Transforms.select(editor, {
              path: [...shiftedLinePath, 0],
              offset: 0,
            })
          } else if (Editor.isEnd(editor, anchor, codeLinePath)) {
            const newLinePath = [...codeLinePath.slice(0, -1), lineIdx + 1]
            Transforms.insertNodes(editor, emptyLine, { at: newLinePath })
            Transforms.select(editor, {
              path: [...newLinePath, 0],
              offset: 0,
            })
          } else {
            Transforms.splitNodes(editor, { at: anchor })
            const newLinePath = [...codeLinePath.slice(0, -1), lineIdx + 1]
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
            if (startLineIndex === undefined || endLineIndex === undefined) {
              return
            }

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
                const spacesChunk = match?.[1]
                if (spacesChunk !== undefined) {
                  const spacesToRemove = spacesChunk.length
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

      if (
        event.key === "Tab" &&
        (!editor.selection || Range.isCollapsed(editor.selection))
      ) {
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
    <Slate
      editor={editor}
      initialValue={value}
      onSelectionChange={(selection) => {
        if (selection && !Range.isCollapsed(selection)) {
          setGhostSelection(selection)
        }
      }}
      onChange={(descendants) => {
        // Descendant is a union of Element and Text, but Slate will never put
        // text nodes at the root level, so this cast is safe:
        setValue(descendants as SlateBlock[])
      }}
    >
      <div className={styles.editorContainer}>
        <EditorToolbarArea ghostSelection={ghostSelection}>
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            decorate={decorate}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={onKeyDown}
            placeholder="Start writing..."
            className={styles.editor}
          />
        </EditorToolbarArea>
      </div>
    </Slate>
  )
}

type DocElementProps = Pick<
  RenderElementProps,
  "attributes" | "children" | "element"
> & {
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
        <LinkElement attributes={attributes} linkElement={node}>
          {children}
        </LinkElement>
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

type CodeLineElementProps = RenderElementProps & {
  element: SlateBlock
  children: React.ReactNode
}

const CodeLineElement: React.FC<CodeLineElementProps> = ({
  attributes,
  element,
  children,
}) => {
  const editor = useSlate()
  const path = ReactEditor.findPath(editor, element)
  const lineIndex = path[path.length - 1] ?? 0

  return (
    <div {...attributes} className={styles.codeLine}>
      <span className={styles.lineNumber} contentEditable={false}>
        {lineIndex + 1}
      </span>
      {children}
    </div>
  )
}

type LinkElementProps = Pick<RenderElementProps, "attributes"> & {
  linkElement: SlateBlock & { type: "link" }
  children: React.ReactNode
}

const LinkElement: React.FC<LinkElementProps> = ({
  attributes: { ref: slateRef, ...attributes },
  linkElement,
  children,
}) => {
  return (
    <a
      {...attributes}
      href={linkElement.url}
      className={styles.link}
      ref={slateRef as React.Ref<HTMLAnchorElement>}
    >
      {children}
    </a>
  )
}
