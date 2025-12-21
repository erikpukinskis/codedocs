import React from "react"
import { describe, expect, test } from "vitest"
import {
  parseDocChunks,
  filterChunks,
  chunkHasOnly,
  chunkHasDemo,
} from "./parseDocChunks"
import { Demo } from "~/Demo"

describe("parseDocChunks", () => {
  test("creates a single chunk when no headings", () => {
    const children = [<p key="1">Hello</p>, <p key="2">World</p>]
    const chunks = parseDocChunks(children)
    expect(chunks).toHaveLength(1)
    expect(chunks[0].elements).toHaveLength(2)
  })

  test("splits at h2 boundaries", () => {
    const children = [
      <p key="1">Intro</p>,
      <h2 key="2">First Section</h2>,
      <p key="3">Content 1</p>,
      <h2 key="4">Second Section</h2>,
      <p key="5">Content 2</p>,
    ]
    const chunks = parseDocChunks(children)
    expect(chunks).toHaveLength(3)
    expect(chunks[0].elements).toHaveLength(1) // <p>Intro</p>
    expect(chunks[1].elements).toHaveLength(2) // <h2> + <p>
    expect(chunks[2].elements).toHaveLength(2) // <h2> + <p>
  })

  test("splits at h3 boundaries", () => {
    const children = [
      <h2 key="1">Section</h2>,
      <p key="2">Intro</p>,
      <h3 key="3">Subsection 1</h3>,
      <Demo key="4">content 1</Demo>,
      <h3 key="5">Subsection 2</h3>,
      <Demo key="6">content 2</Demo>,
    ]
    const chunks = parseDocChunks(children)
    expect(chunks).toHaveLength(3)
  })
})

describe("chunkHasDemo", () => {
  test("returns true when chunk contains a Demo", () => {
    const chunk = {
      elements: [<h2 key="h">Title</h2>, <Demo key="d">content</Demo>],
    }
    expect(chunkHasDemo(chunk)).toBe(true)
  })

  test("returns false when chunk has no Demo", () => {
    const chunk = {
      elements: [<h2 key="h">Title</h2>, <p key="p">content</p>],
    }
    expect(chunkHasDemo(chunk)).toBe(false)
  })
})

describe("chunkHasOnly", () => {
  test("returns true when Demo has only prop", () => {
    const chunk = {
      elements: [
        <h2 key="h">Title</h2>,
        <Demo key="d" only>
          content
        </Demo>,
      ],
    }
    expect(chunkHasOnly(chunk)).toBe(true)
  })

  test("returns false when Demo does not have only prop", () => {
    const chunk = {
      elements: [<h2 key="h">Title</h2>, <Demo key="d">content</Demo>],
    }
    expect(chunkHasOnly(chunk)).toBe(false)
  })
})

describe("filterChunks", () => {
  test("returns all chunks when no only props", () => {
    const chunks = [
      { elements: [<h2 key="h1">Section 1</h2>, <Demo key="d1">a</Demo>] },
      { elements: [<h2 key="h2">Section 2</h2>, <Demo key="d2">b</Demo>] },
    ]
    const result = filterChunks(chunks)
    expect(result).toHaveLength(2)
  })

  test("filters to only chunks with only prop when present", () => {
    const chunks = [
      { elements: [<h2 key="h1">Section 1</h2>, <Demo key="d1">a</Demo>] },
      {
        elements: [
          <h2 key="h2">Section 2</h2>,
          <Demo key="d2" only>
            b
          </Demo>,
        ],
      },
      { elements: [<h2 key="h3">Section 3</h2>, <Demo key="d3">c</Demo>] },
    ]
    const result = filterChunks(chunks)
    expect(result).toHaveLength(1)
    expect(chunkHasOnly(result[0])).toBe(true)
  })

  test("returns multiple chunks when multiple have only", () => {
    const chunks = [
      {
        elements: [
          <h2 key="h1">Section 1</h2>,
          <Demo key="d1" only>
            a
          </Demo>,
        ],
      },
      { elements: [<h2 key="h2">Section 2</h2>, <Demo key="d2">b</Demo>] },
      {
        elements: [
          <h2 key="h3">Section 3</h2>,
          <Demo key="d3" only>
            c
          </Demo>,
        ],
      },
    ]
    const result = filterChunks(chunks)
    expect(result).toHaveLength(2)
  })
})
