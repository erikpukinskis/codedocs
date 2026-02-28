import React from "react"
import { Button, Tag } from "./Mockup.docs"
import { Canvas, PaletteProvider } from "~/Components/PaletteProvider"
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
      <Canvas />
    </PaletteProvider>
  </Doc>
)
