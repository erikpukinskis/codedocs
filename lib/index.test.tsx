import { render } from "@testing-library/react"
import React from "react"
import { describe, it } from "vitest"

const MyComponent = () => <>hello world!</>

describe("MyComponent", () => {
  it("should render without errors", () => {
    render(<MyComponent />)
  })
})
