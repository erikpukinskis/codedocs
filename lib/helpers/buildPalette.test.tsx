import React from "react"
import { describe, expect, test } from "vitest"
import { buildPalette } from "./buildPalette"
import { Component } from "~/Component"
import { Doc } from "~/Doc"

const Button: React.FC<{ label: string }> = ({ label }) => (
  <button>{label}</button>
)

describe("buildPalette", () => {
  test("collects Component elements from doc children", () => {
    const FooDocs = (
      <Doc path="/Docs/Foo">
        <p>Some text</p>
        <Component
          name="Button"
          component={Button}
          props={{ label: { type: "string", value: "Click me" } }}
        />
      </Doc>
    )

    const palette = buildPalette([FooDocs])

    expect(palette).toHaveProperty("Button")
    expect(palette["Button"].component).toBe(Button)
    expect(palette["Button"].props.label.value).toBe("Click me")
  })
})
