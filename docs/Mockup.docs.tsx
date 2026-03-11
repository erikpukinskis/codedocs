// eslint-disable-next-line no-restricted-imports
import { Demo, Doc, Mockup } from "../macro"
import { Button, Tag } from "./Component.docs"
import { slotId } from "~/helpers/componentTypes"

export const MockupDocs = (
  <Doc path="/Docs/Mockup">
    <p>Mockups are visual prototypes built from components in your library:</p>
    <Demo>
      <Mockup
        rootSlotId="tag1"
        slots={{
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
    <p>
      In Codedocs, when a <code>&lt;Mockup&gt;</code> is rendered, the component
      palette opens in the 👈 left sidebar. The palette allows every{" "}
      <code>&lt;Component&gt;</code> that you have documented to be dragged into
      empty slots.
    </p>
    <h2>Editable Text</h2>
    <p>
      The basic <code>&lt;Mockup&gt;</code> component allows you to edit text
      elements in any slot. The element text has to match the exact value of one
      of the props for the editor to make the association.
    </p>
    <Demo>
      <Mockup
        rootSlotId="btn1"
        slots={{
          btn1: {
            id: "btn1",
            component: Button,
            props: {
              label: { type: "string", value: "Edit me" },
              tag: { type: "slot", value: slotId("tag1") },
            },
          },
          tag1: {
            id: "tag1",
            component: Tag,
            props: {
              label: { type: "string", value: "+me too" },
            },
          },
        }}
      />
    </Demo>

    <h2>Slots</h2>
    <p>Mockups start with a single empty slot:</p>
    <Demo>
      <Mockup slots={{}} />
    </Demo>
  </Doc>
)
