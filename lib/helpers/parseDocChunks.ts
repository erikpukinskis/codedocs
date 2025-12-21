import React from "react"
import { Demo } from "~/Demo"

export type DocChunk = {
  elements: React.ReactNode[]
}

/**
 * Checks if an element is a Demo component.
 */
function isDemo(element: React.ReactElement): boolean {
  return element.type === Demo
}

/**
 * Parses Doc children into chunks, splitting at heading boundaries (h2, h3).
 * Each chunk contains the elements from one heading to the next (or end of doc).
 */
export function parseDocChunks(children: React.ReactNode): DocChunk[] {
  const chunks: DocChunk[] = []
  let current: React.ReactNode[] = []

  React.Children.forEach(children, (child) => {
    const isHeading =
      React.isValidElement(child) &&
      (child.type === "h2" || child.type === "h3")

    if (isHeading && current.length > 0) {
      // Start new chunk at heading boundary
      chunks.push({ elements: current })
      current = []
    }

    current.push(child)
  })

  // Don't forget the last chunk
  if (current.length > 0) {
    chunks.push({ elements: current })
  }

  return chunks
}

/**
 * Returns true if this chunk contains a Demo with the `only` prop set.
 */
export function chunkHasOnly(chunk: DocChunk): boolean {
  return chunk.elements.some(
    (el) => React.isValidElement(el) && isDemo(el) && el.props.only
  )
}

/**
 * Returns true if this chunk contains any Demo element.
 */
export function chunkHasDemo(chunk: DocChunk): boolean {
  return chunk.elements.some((el) => React.isValidElement(el) && isDemo(el))
}

/**
 * Filters chunks based on the `only` prop.
 * If any chunk has a Demo with `only`, only those chunks are returned.
 * Otherwise, all chunks are returned.
 */
export function filterChunks(chunks: DocChunk[]): DocChunk[] {
  const anyOnly = chunks.some(chunkHasOnly)
  if (!anyOnly) return chunks

  return chunks.filter(chunkHasOnly)
}
