import React from "react"
import { Button, Tag } from "./Mockup.docs"
import { MockupProvider } from "~/Components/Mockup"
import { PaletteProvider } from "~/Components/PaletteProvider"
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
      <MockupProvider slots={{}} />
    </PaletteProvider>
  </Doc>
)
