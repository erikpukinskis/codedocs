import { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc } from "../macro"
import { Editor, Slot } from "~/Components/Editor"

type TagProps = {
  children?: React.ReactNode
  [key: `data-${string}`]: unknown
}

const Tag: React.FC<TagProps> = ({ children, ...rest }) => (
  <div
    data-component="Tag"
    style={{
      backgroundColor: "#e000ff",
      color: "white",
      padding: "2px 4px",
      borderRadius: 999,
      fontSize: 12,
    }}
    {...rest}
  >
    {children}
  </div>
)

type ButtonProps = {
  children?: React.ReactNode
  tag?: React.ReactNode
  [key: `data-${string}`]: unknown
}

const Button: React.FC<ButtonProps> = ({ children, tag, ...rest }) => {
  const [clicked, setClicked] = useState(false)

  return (
    <>
      <button
        data-component="Button"
        style={{
          border: "none",
          padding: "6px 12px",
          cursor: "pointer",
          borderRadius: 6,
          fontSize: 16,
          backgroundColor: clicked ? "red" : "#9231ff",
          color: "#ffefe6",
          position: "relative",
        }}
        onClick={() => setClicked(true)}
        {...rest}
      >
        {children}
        {tag && (
          <div style={{ position: "absolute", right: -8, top: -8 }}>{tag}</div>
        )}
      </button>
    </>
  )
}

export const EditorDocs = (
  <Doc path="/Components/Editor">
    <h2>Editor</h2>
    <Demo>
      <Editor>
        <Slot
          component={Button}
          props={{
            children: "Hello",
            tag: <Slot component={Tag} props={{ children: "+1" }} />,
          }}
        />
      </Editor>
    </Demo>
  </Doc>
)
