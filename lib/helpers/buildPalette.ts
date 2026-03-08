import React from "react"
import { Component } from "~/Component"
import type { SlotDefLookup } from "~/helpers/componentTypes"
import type { DocElement } from "~/helpers/buildSiteTree"

export function buildPalette(docs: DocElement[]): SlotDefLookup {
  const palette: SlotDefLookup = {}
  for (const doc of docs) {
    collectComponents(doc.props.children, palette)
  }
  return palette
}

function collectComponents(
  children: React.ReactNode,
  palette: SlotDefLookup
): void {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === Component) {
      const { name, component, props } = child.props as React.ComponentProps<
        typeof Component
      >
      palette[name] = { id: name, component, props }
    }
    if (child.props && (child.props as { children?: unknown }).children) {
      collectComponents(
        (child.props as { children: React.ReactNode }).children,
        palette
      )
    }
  })
}
