import React, { useCallback, useMemo, useState } from "react"
import {
  createEditor,
  Editor,
  Element as SlateElement,
  Transforms,
} from "slate"
import type { Descendant } from "slate"
import { withHistory } from "slate-history"
import { Editable, Slate, withReact } from "slate-react"
import type { RenderElementProps } from "slate-react"
import { Code } from "./Code"
import * as styles from "./Doc.css"
import { parseDocChunks, filterChunks } from "./helpers/parseDocChunks"
import { slateToJsx } from "./helpers/slateToJsx"

/**
 * A Slate element node as produced by the macro — all block and inline types
 * used in the editor (paragraph, heading, list-item, link, frozen).
 */
type SlateBlock = SlateElement & {
  type: string
  id?: string
  level?: number
  listType?: "ul" | "ol"
  depth?: number
  url?: string
}

export type DocProps = {
  path: string
  order?: number
  children?: React.ReactNode
  slateDocument?: Descendant[]
  frozenElements?: Record<string, React.ReactNode>
  frozenSources?: Record<string, string>
}

/**
 * Register a documentation page. You should render this component and export it
 * as your default export from your documentation files.
 *
 * Ex:
 *
 *       export default (
 *         <Doc path="/Layout/Page">
 *           <p>Add introductory documentation here.</p>
 *           <img src="/and/images/etc.png" />
 *         </Doc>
 *       )
 *
 * Then you can add the page to a Codedocs site like this:
 *
 *       import * as MyDocs from "~/path/to/MyDocs.docs.tsx"
 *       import { Docs } from "codedocs"
 *       import { render } from "react-dom"
 *
 *       render(
 *         <Docs
 *           docs={[MyDocs]}
 *           ...
 *         />
 *       )
 *
 * See the <Docs> component documentation for more details.
 */
export const Doc = ({
  path,
  children,
  slateDocument,
  frozenElements,
  frozenSources,
}: DocProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("static")

  // TODO: Maybe use a callback so the editor can update this source string?
  const sourceString = useMemo(() => {
    if (!slateDocument || !frozenSources) return undefined
    return slateToJsx(slateDocument, frozenSources)
  }, [slateDocument, frozenSources])

  return (
    <>
      <div className={styles.tabBar}>
        <button
          className={styles.tab({ active: activeTab === "static" })}
          onClick={() => setActiveTab("static")}
        >
          Static
        </button>
        <button
          className={styles.tab({ active: activeTab === "edit" })}
          onClick={() => setActiveTab("edit")}
        >
          Edit
        </button>
        <button
          className={styles.tab({ active: activeTab === "source" })}
          onClick={() => setActiveTab("source")}
        >
          Source
        </button>
      </div>

      {activeTab === "static" && <StaticDoc>{children}</StaticDoc>}

      {activeTab === "edit" && slateDocument !== undefined && (
        <DocEditor
          key={path}
          slateDocument={slateDocument}
          frozenElements={frozenElements ?? {}}
        />
      )}

      {activeTab === "source" && sourceString !== undefined && (
        <Code source={sourceString} mode="tsx" />
      )}
    </>
  )
}

type StaticDocProps = {
  children: React.ReactNode
}

const StaticDoc = ({ children }: StaticDocProps) => {
  const allChunks = parseDocChunks(children)
  const chunks = filterChunks(allChunks)

  return (
    <>
      {chunks.map((chunk, index) => (
        <React.Fragment key={index}>{chunk.elements}</React.Fragment>
      ))}
    </>
  )
}

type DocEditorProps = {
  slateDocument: Descendant[]
  frozenElements: Record<string, React.ReactNode>
}

type TabId = "static" | "edit" | "source"

const DocEditor = ({ slateDocument, frozenElements }: DocEditorProps) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const [value, setValue] = useState<Descendant[]>(slateDocument)

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

      if (event.key === "Tab") {
        event.preventDefault()
        const [match] = Editor.nodes(editor, {
          match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            (n as SlateBlock).type === "list-item",
        })
        if (match) {
          const [node, path] = match
          const currentDepth = (node as SlateBlock).depth ?? 0
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
      <Slate editor={editor} initialValue={value} onChange={setValue}>
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

type DocElementProps = RenderElementProps & {
  frozenElements: Record<string, React.ReactNode>
}

const DocElement = ({
  attributes,
  children,
  element,
  frozenElements,
}: DocElementProps) => {
  const node = element as SlateBlock

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
