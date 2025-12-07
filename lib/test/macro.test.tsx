import { render } from "@testing-library/react"
import React from "react"
import { expect, test } from "vitest"
// eslint-disable-next-line no-restricted-imports
import { DocsApp } from "../../macro"
import * as DemoWithChildren from "./examples/DemoWithChildren.docs"
import * as DemoWithMockCallback from "./examples/DemoWithMockCallback.docs"
import * as DemoWithRenderProp from "./examples/DemoWithRenderProp.docs"

test("macro includes source of Demo children", () => {
  const ui = (
    <DocsApp logo="Codedocs Tests" icon="children" docs={[DemoWithChildren]} />
  )

  const { getByRole } = render(ui)

  expect(
    getByRole("heading", { name: "Demo With Children" })
  ).toBeInTheDocument()

  // TODO(erik): Check the source code displays nicely
})

test("shows the body of the render prop in a Demo", () => {
  const ui = (
    <DocsApp
      logo="Codedocs Tests"
      icon="children"
      docs={[DemoWithRenderProp]}
    />
  )

  const { getByRole } = render(ui)

  expect(
    getByRole("heading", { name: "Demo With Render Prop" })
  ).toBeInTheDocument()

  // TODO(erik): Check the source is just the render function body
})

test("macro doesn't blow up if you use mock callbacks", () => {
  const ui = (
    <DocsApp logo="Codedocs Tests" icon="ghost" docs={[DemoWithMockCallback]} />
  )

  const { getByRole } = render(ui)

  expect(
    getByRole("heading", { name: "Demo With Mock Callback" })
  ).toBeInTheDocument()

  // TODO(erik): Check the source is just the render function body. Maybe in the
  // future have pretty names for the callbacks, like handleClick?
})
