import React, { useState } from "react"
import AceEditor from "react-ace"

import "ace-builds/src-noconflict/mode-tsx"
import "ace-builds/src-noconflict/theme-dracula"
import "ace-builds/src-noconflict/ext-language_tools"

type CodeEditorProps = {
  source: string
}

export const CodeEditor = ({ source }: CodeEditorProps) => {
  const [name] = useState(() => `CodeEditor-${randomNumber()}`)

  return (
    <AceEditor
      value={source}
      mode="tsx"
      theme="dracula"
      onChange={() => {}}
      name={name}
      fontSize={15}
      minLines={4}
      maxLines={999}
      width="100%"
      editorProps={{ $blockScrolling: true }}
      highlightActiveLine={false}
      cursorStart={1}
    />
  )
}

const randomNumber = () => {
  const [, number] = Math.random().toString().split(".")
  return number
}
