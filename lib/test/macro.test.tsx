import { render } from "@testing-library/react"
import React from "react"
import { expect, test } from "vitest"
// eslint-disable-next-line no-restricted-imports
import { DocsApp } from "../../macro"
import * as DemoWithChildren from "./examples/DemoWithChildren.docs"

test("macro includes source of Demo children", () => {
  const ui = (
    <DocsApp
      logo="Demo With Children"
      icon="children"
      docs={[DemoWithChildren]}
    />
  )

  const { getByRole } = render(ui)

  expect(getByRole("link", { name: "Demo With Children" })).toBeInTheDocument()
})
