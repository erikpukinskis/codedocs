import { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc } from "../macro"
import { MockupProvider, Slot } from "~/Components/Mockup"
import { slotId } from "~/helpers/componentTypes"

type TagProps = {
  label: string
  [key: `data-${string}`]: unknown
}

export const Tag: React.FC<TagProps> = ({ label, ...rest }) => (
  <div
    data-component="Tag"
    style={{
      backgroundColor: "#e000ff",
      color: "white",
      padding: "0px 4px",
      borderRadius: 999,
      fontSize: 12,
      display: "inline-block",
    }}
    {...rest}
  >
    {label}
  </div>
)

type ButtonProps = {
  label: string
  tag?: React.ReactNode
  [key: `data-${string}`]: unknown
}

export const Button: React.FC<ButtonProps> = ({ label, tag, ...rest }) => {
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
        {label}
        {tag && (
          <div style={{ position: "absolute", right: -8, top: -8 }}>{tag}</div>
        )}
      </button>
    </>
  )
}

export const MockupDocs = (
  <Doc path="/Docs/Mockups">
    <h2>Mockup</h2>
    <Demo>
      <MockupProvider
        slots={{
          btn1: {
            id: "btn1",
            component: Button,
            props: {
              label: "Hello",
              tag: slotId("tag1"),
            },
          },
          tag1: {
            id: "tag1",
            component: Tag,
            props: {
              label: "+1",
            },
          },
        }}
      >
        <Slot id="btn1" />
      </MockupProvider>
    </Demo>
  </Doc>
)
