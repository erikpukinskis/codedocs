import { styled } from "@stitches/react"
import React, { useState } from "react"
import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-tsx"
import "ace-builds/src-noconflict/mode-markdown"
import "ace-builds/src-noconflict/theme-dracula"
import "ace-builds/src-noconflict/ext-language_tools"

const CodeContainer = styled("div", {
  borderRadius: 6,
  background: "#282A36",
  padding: 6,
  opacity: "90%",
})

type CodeProps = EditorProps & {
  className?: string
}

export const Code = ({ className, source, mode }: CodeProps) => (
  <CodeContainer className={className}>
    <Editor source={source} mode={mode} />
  </CodeContainer>
)

type EditorProps = {
  source: string
  mode: "tsx" | "markdown"
}

const Editor = ({ source, mode }: EditorProps) => {
  const [name] = useState(() => `CodeEditor-${randomNumber()}`)

  return (
    <AceEditor
      value={source}
      mode={mode}
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