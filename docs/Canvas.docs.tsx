import React from "react"
import { Button, Tag } from "./Mockup.docs"
import { MockupProvider } from "~/Components/Mockup"
import { PaletteProvider } from "~/Components/PaletteProvider"
import { EmptySlot, Slot } from "~/Components/Slot"
import { Doc } from "~/Doc"

export const CanvasDocs = (
  <Doc path="/Docs/Canvas">
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
      <MockupProvider
        slots={{
          abc123: {
            id: "abc123",
            component: EmptySlot,
            props: {
              id: { type: "string", value: "abc123" },
            },
          },
        }}
      >
        <Slot id="abc123" />
      </MockupProvider>
    </PaletteProvider>
  </Doc>
)
