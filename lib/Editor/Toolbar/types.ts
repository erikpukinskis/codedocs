import type React from "react"
import type { Path, Range } from "slate"
import type { HistoryEditor } from "slate-history"
import type { ReactEditor } from "slate-react"
import type { LinkElement as LinkElementNode } from "~/Editor/types"

export type SlateEditor = ReactEditor & HistoryEditor

export type LinkDraft = { range: Range; initialUrl: string }

export type ToolbarMode =
  | { kind: "none" }
  | { kind: "formatting"; range: Range; targetRect: DOMRect }
  | { kind: "linkDraft"; draft: LinkDraft; priorRect: DOMRect }
  | { kind: "linkHover"; linkPath: Path; linkNode: LinkElementNode }
  | { kind: "linkEditing"; linkPath: Path; linkNode: LinkElementNode }

export type ToolbarControls = {
  beginLinkDraft: (draft: LinkDraft) => void
  cancelLinkDraft: () => void
  saveLinkDraft: (url: string) => void
  removeLinkDraft: () => void
  beginLinkEdit: (path: Path, node: LinkElementNode) => void
  cancelLinkEdit: () => void
  saveLinkEdit: () => void
  /** Call after the editor has already removed the link node (e.g. unwrap). */
  removeLink: () => void
}

export type ToolbarDescriptor = {
  target: Element | DOMRectReadOnly
  content: React.ReactNode
  /** When true the toolbar bypasses the 200ms hover-delay and shows immediately. */
  immediate?: boolean
}
