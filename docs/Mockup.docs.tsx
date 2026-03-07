import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"
// eslint-disable-next-line no-restricted-imports
// import { Demo, Doc } from "../macro"
import { Component } from "~/Component"
import { Demo } from "~/Demo"
import { Doc } from "~/Doc"
import { slotId } from "~/helpers/componentTypes"
import { MockupProvider } from "~/Mockup"

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

type IconProps = {
  size: "8px" | "12px" | "16px"
  icon: "book" | "copy" | "close" | "eye-slash" | "bug"
}

const Icon: React.FC<IconProps> = ({ size, icon }) => (
  <FontAwesomeIcon icon={icon} width={size} height={size} />
)

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

    <h2>Components</h2>

    <p>
      Put a <code>&lt;Component /&gt;</code> in your docs to show a demo with
      editable props. Any components you document this way will also be added to
      the component palette, available to be added to mockups throughout your
      docs.
    </p>

    <Component
      name="Button"
      component={Button}
      props={{
        label: {
          type: "string",
          value: "Button",
          description: <>text to display on the button</>,
        },
        tag: { type: "slot", value: undefined },
      }}
    />

    <Component
      name="Tag"
      component={Tag}
      props={{
        label: { type: "string", value: "+1" },
      }}
    />
    {/* <Component name="Icon" component={Icon} props={{
  size: { type: "enum", options: ["8px", "12px", "16px"], value: "16px" },
  icon: { type: "enum", options: ["book", "copy", "close", "eye-slash", "bug"], value: "eye-slash" },
}} /> */}
    <h2>Slots</h2>
    <p>An empty mockup starts with a single empty slot.</p>
    <Demo>
      <MockupProvider slots={{}} />
    </Demo>
  </Doc>
)
