import React from "react"
import { Button, Tag } from "./Mockup.docs"
import { MockupProvider, Slot } from "~/Components/Mockup"
import { PaletteProvider } from "~/Components/PaletteProvider"
import { EmptySlot } from "~/Components/Slot"
import { Doc } from "~/Doc"

export const CanvasDocs = (
  <Doc path="/Docs/Canvas">
    <PaletteProvider
      palette={{
        Button: {
          component: Button,
          props: {
            label: { type: "string", default: "Button" },
            tag: { type: "slot", optional: true, default: undefined },
          },
        },
        Tag: {
          component: Tag,
          props: {
            label: { type: "string", default: "+1" },
          },
        },
      }}
    >
      <MockupProvider
        // How should MockupProvider find out when
        slots={{
          abc123: {
            id: "abc123",
            component: EmptySlot,
            props: { id: "abc123" },
          },
        }}
      >
        <Slot id="abc123" />
      </MockupProvider>
    </PaletteProvider>
  </Doc>
)
