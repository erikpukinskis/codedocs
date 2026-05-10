import type React from "react"
import type { Path, Range } from "slate"
import type { HistoryEditor } from "slate-history"
import type { ReactEditor } from "slate-react"
import type { LinkElement as LinkElementNode } from "~/Editor/types"

export type SlateEditor = ReactEditor & HistoryEditor

/** Draft link already exists in the document; Save updates `url` only. */
export type LinkDraft = {
  linkPath: Path
  linkNode: LinkElementNode
  initialUrl: string
}

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
  | { type: "cancelLinkDraft"; restoreRange: Range }
  | { type: "saveLinkDraft"; linkPath: Path; linkNode: LinkElementNode }
  | { type: "removeLinkDraft" }
  | { type: "beginLinkEdit"; linkPath: Path; linkNode: LinkElementNode }
  | { type: "cancelLinkEdit" }
  | { type: "saveLinkEdit"; linkPath: Path; linkNode: LinkElementNode }
  | { type: "removeLink" }

export type ToolbarControls = {
  beginLinkDraft: (draft: LinkDraft) => void
  cancelLinkDraft: (restoreRange: Range) => void
  /** Mode transition only — document already has the new link and URL. */
  saveLinkDraft: (path: Path, node: LinkElementNode) => void
  removeLinkDraft: () => void
  beginLinkEdit: (path: Path, node: LinkElementNode) => void
  cancelLinkEdit: () => void
  saveLinkEdit: (linkPath: Path, linkNode: LinkElementNode) => void
  /** Call after the editor has already removed the link node (e.g. unwrap). */
  removeLink: () => void
}

export type ToolbarDescriptor = {
  target: Element | DOMRectReadOnly
  content: React.ReactNode
  /** When true the toolbar bypasses the 200ms hover-delay and shows immediately. */
  immediate?: boolean
}
