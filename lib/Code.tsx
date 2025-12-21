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
  onClickClose?: () => void
}

export const Code = ({ className, source, mode, onClickClose }: CodeProps) => (
  <div className={`${styles.codeContainer} ${className || ""}`}>
    <div className={styles.codeInnerContainer}>
      <Editor source={source} mode={mode} />
      <Buttons source={source} onClickClose={onClickClose} />
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
      fontSize={14}
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

type ButtonsProps = {
  source: string
  onClickClose?: () => void
}

const Buttons = ({ source, onClickClose }: ButtonsProps) => {
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
      {onClickClose && (
        <Components.Button onClick={onClickClose} secondary>
          <FontAwesomeIcon icon="close" />
        </Components.Button>
      )}
    </div>
  )
}
