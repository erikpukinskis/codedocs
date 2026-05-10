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

/**
 * All toolbar state transitions. Pure actions — no side effects.
 * Mutations to the Slate document must happen in the caller before dispatching.
 */
export type ToolbarAction =
  | { type: "environmentChanged"; next: ToolbarMode }
  | { type: "beginLinkDraft"; draft: LinkDraft }
  | { type: "cancelLinkDraft" }
  | { type: "saveLinkDraft" }
  | { type: "removeLinkDraft" }
  | { type: "beginLinkEdit"; linkPath: Path; linkNode: LinkElementNode }
  | { type: "cancelLinkEdit" }
  | { type: "saveLinkEdit"; linkPath: Path; linkNode: LinkElementNode }
  | { type: "removeLink" }

export type ToolbarControls = {
  beginLinkDraft: (draft: LinkDraft) => void
  cancelLinkDraft: () => void
  /** Call after `wrapRangeAsLink` has been applied (mode transition only). */
  saveLinkDraft: () => void
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
