import { render } from "@testing-library/react"
import React from "react"
import { expect, test } from "vitest"
// eslint-disable-next-line no-restricted-imports
import { DocsApp } from "../../macro"
import * as DemoWithChildren from "./examples/DemoWithChildren.docs"
import * as DemoWithMockCallback from "./examples/DemoWithMockCallback.docs"

test.only("macro includes source of Demo children", () => {
  const ui = (
    <DocsApp logo="Codedocs Tests" icon="children" docs={[DemoWithChildren]} />
  )

  const { getByRole } = render(ui)

  expect(
    getByRole("heading", { name: "Demo With Children" })
  ).toBeInTheDocument()
})

test("macro doesn't blow up if you use mock callbacks", () => {
  const ui = (
    <DocsApp logo="Codedocs Tests" icon="ghost" docs={[DemoWithMockCallback]} />
  )

  const { getByRole } = render(ui)

  expect(getByRole("link", { name: "Demo With Children" })).toBeInTheDocument()
})
