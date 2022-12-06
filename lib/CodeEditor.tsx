import { styled } from "@stitches/react"
import React, { useState } from "react"
import AceEditor from "react-ace"

import "ace-builds/src-noconflict/mode-tsx"
import "ace-builds/src-noconflict/theme-dracula"
import "ace-builds/src-noconflict/ext-language_tools"
// Creates an Instance. At this step, a configuration object can be passed in
// as an argument.

type CodeEditorProps = {
  source: string
}

const EditorContainer = styled("div", {
  borderRadius: 6,
  background: "#282A36",
  padding: 6,
  opacity: "90%",
})

// The Editor accepts an array of plugins. In this case, only the emojiPlugin is
// passed in, although it is possible to pass in multiple plugins.
// The EmojiSuggestions component is internally connected to the editor and will
// be updated & positioned once the user starts the autocompletion with a colon.
// The EmojiSelect component also is internally connected to the editor. He add
// a button which allows open emoji select popup.
export const CodeEditor = ({ source }: CodeEditorProps) => {
  const [name] = useState(() => `CodeEditor-${randomNumber()}`)

  return (
    <EditorContainer>
      <AceEditor
        value={source}
        mode="tsx"
        theme="dracula"
        onChange={() => {}}
        name={name}
        fontSize={15}
        minLines={4}
        maxLines={20}
        editorProps={{ $blockScrolling: true }}
        highlightActiveLine={false}
        cursorStart={1}
      />
    </EditorContainer>
  )
}

const randomNumber = () => {
  const [, number] = Math.random().toString().split(".")
  return number
}
