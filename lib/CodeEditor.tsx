import React, { useState, useMemo } from "react"
import { EditorState, ContentState } from "draft-js"
import "draft-js/dist/Draft.css"

import PluginEditor from "@draft-js-plugins/editor"
import createPrismPlugin from "draft-js-prism-plugin"
import "prismjs/themes/prism.css" // add prism.css to add highlights

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
    const contentState = ContentState.createFromText(source)
    return EditorState.createWithContent(contentState)
  })

  const plugins = useMemo(() => [createPrismPlugin()], [])

  return (
    <PluginEditor
      editorState={editorState}
      onChange={setEditorState}
      plugins={plugins}
    />
  )
}
