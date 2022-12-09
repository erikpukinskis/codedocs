import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { styled } from "@stitches/react"
import copyTextToClipboard from "copy-text-to-clipboard"
import React, { useState } from "react"
import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-sh"
import "ace-builds/src-noconflict/mode-tsx"
import "ace-builds/src-noconflict/mode-markdown"
import "ace-builds/src-noconflict/theme-dracula"
import "ace-builds/src-noconflict/ext-language_tools"
import { useComponents } from "./ComponentContext"

const CodeContainer = styled("div", {
  borderRadius: 6,
  background: "#282A36",
  padding: 6,
  opacity: "90%",
  maxWidth: "45em",
  position: "relative",
})

type CodeProps = EditorProps & {
  className?: string
}

export const Code = ({ className, source, mode }: CodeProps) => (
  <CodeContainer className={className}>
    <Editor source={source} mode={mode} />
    <CopyButton source={source} />
  </CodeContainer>
)

type EditorProps = {
  source: string
  mode?: "tsx" | "markdown"
}

const Editor = ({ source, mode }: EditorProps) => {
  const [name] = useState(() => `CodeEditor-${randomNumber()}`)

  return (
    <AceEditor
      value={source}
      mode={mode ?? "sh"}
      theme="dracula"
      name={name}
      fontSize={15}
      minLines={2}
      maxLines={999}
      width="100%"
      editorProps={{
        $blockScrolling: true,
      }}
      setOptions={{
        highlightActiveLine: false,
        highlightGutterLine: false,
        readOnly: true,
      }}
    />
  )
}

const randomNumber = () => {
  const [, number] = Math.random().toString().split(".")
  return number
}

type CopyButtonProps = {
  source: string
}

const CopyButton = ({ source }: CopyButtonProps) => {
  const Components = useComponents()
  const [buttonText, setButtonText] = useState("Copy")

  const copy = (event: React.MouseEvent) => {
    event.preventDefault()
    copyTextToClipboard(source)
    setButtonText("Copied!")
    setTimeout(() => {
      setButtonText("Copy")
    }, 2000)
  }

  return (
    <CopyButtonContainer>
      <Components.Button onClick={copy}>
        <FontAwesomeIcon icon="copy" /> {buttonText}
      </Components.Button>
    </CopyButtonContainer>
  )
}

const CopyButtonContainer = styled("div", {
  position: "absolute",
  zIndex: 1,
  right: 8,
  bottom: 8,
})
