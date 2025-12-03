import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import copyTextToClipboard from "copy-text-to-clipboard"
import React, { useState } from "react"
import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-sh"
import "ace-builds/src-noconflict/mode-tsx"
import "ace-builds/src-noconflict/mode-markdown"
import "ace-builds/src-noconflict/theme-dracula"
import "ace-builds/src-noconflict/ext-language_tools"
import * as styles from "./Code.css"
import { useComponents } from "./ComponentContext"

type CodeProps = EditorProps & {
  className?: string
}

export const Code = ({ className, source, mode }: CodeProps) => (
  <div className={`${styles.codeContainer} ${className || ""}`}>
    <div className={styles.codeInnerContainer}>
      <Editor source={source} mode={mode} />
      <CopyButton source={source} />
    </div>
  </div>
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
    <div className={styles.copyButtonContainer}>
      <Components.Button onClick={copy}>
        <FontAwesomeIcon icon="copy" /> {buttonText}
      </Components.Button>
    </div>
  )
}
