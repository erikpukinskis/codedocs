import type { IconDefinition } from "@fortawesome/free-regular-svg-icons"
import {
  faBell as regularBell,
  faCopy as regularCopy,
  faEyeSlash as regularEyeSlash,
  faPenToSquare as regularPenToSquare,
  faCalendar as regularCalendar,
} from "@fortawesome/free-regular-svg-icons"
import {
  faBell as solidBell,
  faCopy as solidCopy,
  faEyeSlash as solidEyeSlash,
  faPencil as solidPenToSquare,
  faCalendar as solidCalendar,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Component, Demo, Doc } from "../macro"
import { Code } from "~/Code"

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
      maxWidth: 50,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
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

type IconName = "bell" | "copy" | "eye-slash" | "pen-to-square" | "calendar"

const icons: Record<"solid" | "regular", Record<IconName, IconDefinition>> = {
  solid: {
    "copy": solidCopy,
    "bell": solidBell,
    "eye-slash": solidEyeSlash,
    "pen-to-square": solidPenToSquare,
    "calendar": solidCalendar,
  },
  regular: {
    "bell": regularBell,
    "copy": regularCopy,
    "eye-slash": regularEyeSlash,
    "pen-to-square": regularPenToSquare,
    "calendar": regularCalendar,
  },
}

type IconProps = {
  size: number
  solid: boolean
  icon: IconName
}

export const Icon: React.FC<IconProps> = ({ size, solid = false, icon }) => (
  <FontAwesomeIcon
    icon={icons[solid ? "solid" : "regular"][icon]}
    style={{ fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }}
  />
)

export const ComponentDocs = (
  <Doc path="/Docs/Component">
    <p>
      Put a <code>&lt;Component&gt;</code> in your docs to show a demo with
      editable props.
    </p>
    <p>
      Any components you document this way will also be added to the component
      palette, available to be added to mockups throughout your docs.
    </p>
    <h3>Button</h3>
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
    <h3>Button</h3>
    <Component
      name="Tag"
      component={Tag}
      props={{
        label: { type: "string", value: "+1" },
      }}
    />
    <h2>Composing components</h2>
    <p>
      Typically a <code>&lt;Component&gt;</code> is only documented once, in
      order to show the full set of props, and allow for quick mockups of simple
      props.
    </p>
    <p>
      Variations of components, slots, and other advanced features will
      typically just be demonstrated with a <code>&lt;Demo&gt;</code>:
    </p>
    <h3>Button with tag</h3>
    <Demo>
      <Button label="Button" tag={<Tag label="+1" />} />
    </Demo>
    <h2>Simple prop editing</h2>
    <p>
      <code>String</code>, <code>Boolean</code>, <code>Number</code>, and string
      union props can be edited in the Component editor.
    </p>
    <Component
      name="Icon"
      component={Icon}
      props={{
        size: {
          type: "number",
          value: 48,
        },
        solid: {
          type: "boolean",
          value: false,
        },
        icon: {
          type: "string-union",
          options: Object.keys(icons.solid),
          value: "eye-slash",
        },
      }}
    />
    <h2>Skipped components</h2>
    Like demos, broken components can be temporarily ignored with the{" "}
    <code>skip</code> prop:
    <Component
      skip
      name="SkipMe"
      component={Button}
      props={{
        label: { type: "string", value: "" },
      }}
    />
    <h2>Focus mode</h2>
    <p>
      Also like demos, components obey the <code>only</code> prop, to allow you
      to focus on a specific component:
    </p>
    <Code
      mode="tsx"
      source={`<Component
  only
  name="Button"
  component={Button}
  props={...}
/>`}
    />
  </Doc>
)
