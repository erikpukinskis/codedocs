import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React from "react"
import type { Range } from "slate"
import { Editor } from "slate"
import { useSlate } from "slate-react"
import { useComponents } from "~/ComponentContext"
import type { FormatMark } from "~/helpers/range"
import { isMarkActiveInSelection } from "~/helpers/range"

type FormattingToolbarContentProps = { activeRange: Range }

export const FormattingToolbarContent: React.FC<
  FormattingToolbarContentProps
> = ({ activeRange }) => {
  const editor = useSlate()
  const Components = useComponents()

  const toggleMark = (key: FormatMark) => () => {
    if (!activeRange) return
    if (isMarkActiveInSelection(editor, key, activeRange)) {
      Editor.removeMark(editor, key)
    } else {
      Editor.addMark(editor, key, true)
    }
  }

  return (
    <>
      <Components.Button
        variant="borderless"
        aria-label="Bold"
        onClick={toggleMark("bold")}
      >
        <FontAwesomeIcon icon="bold" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Italic"
        onClick={toggleMark("italic")}
      >
        <FontAwesomeIcon icon="italic" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Underline"
        onClick={toggleMark("underline")}
      >
        <FontAwesomeIcon icon="underline" />
      </Components.Button>
      <Components.Button
        variant="borderless"
        aria-label="Strikethrough"
        onClick={toggleMark("strikethrough")}
      >
        <FontAwesomeIcon icon="strikethrough" />
      </Components.Button>
    </>
  )
}
