import type { BaseEditor } from "slate"
import type { HistoryEditor } from "slate-history"
import type { ReactEditor } from "slate-react"
import type { SlateBlock, SlateLeaf } from "./types"

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: SlateBlock
    Text: SlateLeaf
  }
}
