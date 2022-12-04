import PluginEditor from "@draft-js-plugins/editor"
import { EditorState, ContentState } from "draft-js"
import "draft-js/dist/Draft.css"
import createPrismPlugin from "draft-js-prism-plugin"
import prism from "prismjs"
import React, { useState, useMemo } from "react"
import "prismjs/themes/prism.css"

// Creates an Instance. At this step, a configuration object can be passed in
// as an argument.

type CodeEditorProps = {
  source: string
}

// The Editor accepts an array of plugins. In this case, only the emojiPlugin is
// passed in, although it is possible to pass in multiple plugins.
// The EmojiSuggestions component is internally connected to the editor and will
// be updated & positioned once the user starts the autocompletion with a colon.
// The EmojiSelect component also is internally connected to the editor. He add
// a button which allows open emoji select popup.
export const CodeEditor = ({ source }: CodeEditorProps) => {
  const [editorState, setEditorState] = useState(() => {
    const contentState = ContentState.createFromText(source ?? "hello, world")
    return EditorState.createWithContent(contentState)
  })

  const plugins = useMemo(
    () => [
      createPrismPlugin({
        prism,
      }),
    ],
    []
  )

  return (
    <PluginEditor
      editorState={editorState}
      onChange={setEditorState}
      plugins={plugins}
    />
  )
}