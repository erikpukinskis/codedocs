import React, { useMemo, useState } from "react"
import { Code } from "./Code"
import * as styles from "./Doc.css"
import { DocEditor } from "./Editor/Editor"
import { type SlateBlock } from "./Editor/types"
import { parseDocChunks, filterChunks } from "./helpers/parseDocChunks"
import { slateToJsx } from "./helpers/slateToJsx"

export type DocProps = {
  path: string
  order?: number
  children?: React.ReactNode
  slateDocument?: SlateBlock[]
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
  const [activeTab, setActiveTab] = useState<TabId>("edit")

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

type TabId = "static" | "edit" | "source"
