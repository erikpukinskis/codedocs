import type React from "react"
import type { Path, Range } from "slate"
import type { HistoryEditor } from "slate-history"
import type { ReactEditor } from "slate-react"

export type SlateEditor = ReactEditor & HistoryEditor

export type LinkDraft = { range: Range; initialUrl: string }

export type ToolbarContext = {
  editor: SlateEditor
  selection: Range | null
  focused: boolean
  ghostSelection: Range | undefined
  areaRef: React.RefObject<HTMLDivElement | null>
  linkDraft: LinkDraft | null
}

export type ToolbarControls = {
  pinPath: (path: Path) => void
  clearPinnedPath: () => void
  setLinkDraft: (draft: LinkDraft) => void
  clearLinkDraft: () => void
}

export type MatchContext = ToolbarContext & {
  hoverPath: Path | null
  caretPath: Path | null
  pinnedPath: Path | null
  controls: ToolbarControls
}

export type ToolbarDescriptor = {
  target: Element | DOMRectReadOnly
  content: React.ReactNode
  /** When true the toolbar bypasses the 200ms hover-delay and shows immediately. */
  immediate?: boolean
}

export type ToolbarMatcher = (context: MatchContext) => ToolbarDescriptor | null
