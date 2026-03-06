import { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc } from "../macro"
import { slotId } from "~/helpers/componentTypes"
import { MockupProvider } from "~/Mockup"
import { PaletteProvider } from "~/PaletteProvider"

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
    <h2>Editable Text</h2>
    <p>
      The basic <code>Mockup</code> component allows you to edit text elements
      in any slot.The element text has to match the exact value of one of the
      props for the editor to make the association.
    </p>
    <Demo>
      <MockupProvider
        rootSlotId="btn1"
        slots={{
          btn1: {
            id: "btn1",
            component: Button,
            props: {
              label: { type: "string", value: "Hello" },
              tag: { type: "slot", value: slotId("tag1") },
            },
          },
          tag1: {
            id: "tag1",
            component: Tag,
            props: {
              label: { type: "string", value: "+1" },
            },
          },
        }}
      />
    </Demo>

    <h2>Slots</h2>

    <p>
      By wrapping your <code>MockupProvider</code> in a{" "}
      <code>PaletteProvider</code>, you can provide a set of components that can
      be dragged into any slot.
    </p>

    <Demo>
      <PaletteProvider
        palette={{
          Button: {
            id: "Button",
            component: Button,
            props: {
              label: { type: "string", value: "Button" },
              tag: { type: "slot", value: undefined },
            },
          },
          Tag: {
            id: "Tag",
            component: Tag,
            props: {
              label: { type: "string", value: "+1" },
            },
          },
        }}
      >
        <MockupProvider slots={{}} />
      </PaletteProvider>
    </Demo>
  </Doc>
)
