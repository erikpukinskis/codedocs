import type React from "react"
import type { Path, Range } from "slate"
import type { HistoryEditor } from "slate-history"
import type { ReactEditor } from "slate-react"

export type SlateEditor = ReactEditor & HistoryEditor

export type ToolbarContext = {
  editor: SlateEditor
  selection: Range | null
  focused: boolean
  ghostSelection: Range | undefined
  areaRef: React.RefObject<HTMLDivElement | null>
}

export type ToolbarControls = {
  pinOpen: () => void
  unpinOpen: () => void
}

export type MatchContext = ToolbarContext & {
  hoverPath: Path | null
  activePath: Path | null
  pinnedPath: Path | null
  controls: ToolbarControls
}

export type ToolbarDescriptor = {
  target: Element | DOMRectReadOnly
  content: React.ReactNode
}

export type ToolbarMatcher = (context: MatchContext) => ToolbarDescriptor | null
