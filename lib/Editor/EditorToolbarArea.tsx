import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { Editor, Path, Range, Transforms } from "slate"
import type { DOMPoint } from "slate-dom"
import type { HistoryEditor } from "slate-history"
import { ReactEditor, useSlate, useSlateSelection } from "slate-react"
import {
  isMarkActiveInSelection,
  resolveFormattingChrome,
  type FormatMark,
} from "./inlineChrome/resolveInlineChrome"
import { isLinkElement, type LinkElement as LinkElementNode } from "./types"
import { useComponents } from "~/ComponentContext"
import { ToolbarArea } from "~/Components/ToolbarArea"
import type { Components } from "~/ComponentTypes"

export type ToolbarContentProps = {
  pinOpen: () => void
  unpinOpen: () => void
}

/** Firefox; Chromium uses `caretRangeFromPoint` instead. */
type DomCaretPosition = {
  readonly offsetNode: Node
  readonly offset: number
}

type DocumentWithCaretPosition = Document & {
  caretPositionFromPoint?: (x: number, y: number) => DomCaretPosition | null
}

function domPointFromClientXY(x: number, y: number): DOMPoint | null {
  const pos = (document as DocumentWithCaretPosition).caretPositionFromPoint?.(
    x,
    y
  )
  if (pos) {
    return [pos.offsetNode, pos.offset]
  }
  const range = document.caretRangeFromPoint(x, y)
  if (!range) return null
  return [range.startContainer, range.startOffset]
}

function pathsEqual(a: Path | null, b: Path | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return Path.equals(a, b)
}

type SlateEditor = ReactEditor & HistoryEditor

function linkPathAtPoint(
  editor: SlateEditor,
  point: { path: Path; offset: number }
): Path | null {
  const above = Editor.above(editor, {
    at: point,
    match: isLinkElement,
  })
  return above ? above[1] : null
}

function isValidLinkPath(editor: SlateEditor, path: Path): boolean {
  try {
    const [n] = Editor.node(editor, path)
    return isLinkElement(n)
  } catch {
    return false
  }
}

type EditorToolbarAreaProps = {
  ghostSelection: Range | null
  children: React.ReactNode
}

export const EditorToolbarArea: React.FC<EditorToolbarAreaProps> = ({
  ghostSelection,
  children,
}) => {
  const toolbarListenerAreaRef = useRef<HTMLDivElement>(null)
  const editor = useSlate() as SlateEditor
  const selection = useSlateSelection()
  const Components = useComponents()

  const [hoverLinkPath, setHoverLinkPath] = useState<Path | null>(null)
  const hoverLinkPathRef = useRef<Path | null>(null)
  const [pinnedLinkPath, setPinnedLinkPath] = useState<Path | null>(null)
  const [linkEdit, setLinkEdit] = useState<{
    path: Path
    url: string
  } | null>(null)

  const focused = ReactEditor.isFocused(editor)

  const caretLinkPath =
    selection == null || !focused || !Range.isCollapsed(selection)
      ? null
      : linkPathAtPoint(editor, selection.anchor)

  const pinStillValid =
    pinnedLinkPath !== null && isValidLinkPath(editor, pinnedLinkPath)

  useEffect(() => {
    if (pinnedLinkPath !== null && !pinStillValid) {
      setPinnedLinkPath(null)
      setLinkEdit(null)
    }
  }, [pinnedLinkPath, pinStillValid])

  const activeLinkPath = (() => {
    if (pinnedLinkPath && isValidLinkPath(editor, pinnedLinkPath)) {
      return pinnedLinkPath
    }
    if (focused && caretLinkPath) return caretLinkPath
    return hoverLinkPath
  })()

  const { activeRange, targetRect } = resolveFormattingChrome(
    editor,
    selection,
    ghostSelection,
    focused
  )
  const showFormatting = Boolean(activeRange && targetRect)

  useEffect(() => {
    const area = toolbarListenerAreaRef.current
    if (!area) return

    const setHoverIfChanged = (next: Path | null) => {
      if (pathsEqual(hoverLinkPathRef.current, next)) return
      hoverLinkPathRef.current = next
      setHoverLinkPath(next)
    }

    const onPointerMove = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (!el || !area.contains(el)) {
        setHoverIfChanged(null)
        return
      }
      const domPoint = domPointFromClientXY(e.clientX, e.clientY)
      if (!domPoint || !area.contains(domPoint[0])) {
        setHoverIfChanged(null)
        return
      }
      const slatePoint = ReactEditor.toSlatePoint(editor, domPoint, {
        exactMatch: false,
        suppressThrow: true,
      })
      if (!slatePoint) {
        setHoverIfChanged(null)
        return
      }
      const nextPath = linkPathAtPoint(editor, slatePoint)
      setHoverIfChanged(nextPath)
    }

    const onPointerLeave = () => {
      setHoverIfChanged(null)
    }

    area.addEventListener("pointermove", onPointerMove)
    area.addEventListener("pointerleave", onPointerLeave)
    return () => {
      area.removeEventListener("pointermove", onPointerMove)
      area.removeEventListener("pointerleave", onPointerLeave)
    }
  }, [editor])

  const pinOpen = useCallback(() => {
    if (activeLinkPath) setPinnedLinkPath(activeLinkPath)
  }, [activeLinkPath])

  const unpinOpen = useCallback(() => {
    setPinnedLinkPath(null)
  }, [])

  const toggleMark = (key: FormatMark) => () => {
    if (!activeRange) return
    if (isMarkActiveInSelection(editor, key, activeRange)) {
      Editor.removeMark(editor, key)
    } else {
      Editor.addMark(editor, key, true)
    }
  }

  if (showFormatting && activeRange && targetRect) {
    return (
      <ToolbarArea
        target={targetRect}
        open
        ref={toolbarListenerAreaRef}
        content={
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
        }
      >
        {children}
      </ToolbarArea>
    )
  }

  if (!activeLinkPath || !isValidLinkPath(editor, activeLinkPath)) {
    return children
  }

  let linkNode: LinkElementNode
  try {
    const [n] = Editor.node(editor, activeLinkPath)
    if (!isLinkElement(n)) return null
    linkNode = n
  } catch {
    return null
  }

  let linkDom: HTMLElement
  try {
    linkDom = ReactEditor.toDOMNode(editor, linkNode)
  } catch {
    return null
  }

  return (
    // TODO: Unify this with the formatting toolbar. Just switch out the content.
    <ToolbarArea
      target={linkDom}
      open
      ref={toolbarListenerAreaRef}
      content={
        <>
          <LinkToolbarContent
            editor={editor}
            linkPath={activeLinkPath}
            linkNode={linkNode}
            linkEdit={linkEdit}
            setLinkEdit={setLinkEdit}
            pinOpen={pinOpen}
            unpinOpen={unpinOpen}
            Components={Components}
          />
        </>
      }
    >
      {children}
    </ToolbarArea>
  )
}

type LinkToolbarContentProps = ToolbarContentProps & {
  editor: SlateEditor
  linkPath: Path
  linkNode: LinkElementNode
  linkEdit: { path: Path; url: string } | null
  setLinkEdit: React.Dispatch<
    React.SetStateAction<{ path: Path; url: string } | null>
  >
  Components: Components
}

function LinkToolbarContent({
  editor,
  linkPath,
  linkNode,
  linkEdit,
  setLinkEdit,
  pinOpen,
  unpinOpen,
  Components,
}: LinkToolbarContentProps) {
  useEffect(() => {
    setLinkEdit((prev) =>
      prev && !Path.equals(prev.path, linkPath) ? null : prev
    )
  }, [linkPath, setLinkEdit])

  useEffect(() => {
    return () => {
      unpinOpen()
    }
  }, [unpinOpen])

  const save = () => {
    if (!linkEdit) return
    if (linkEdit.url !== linkNode.url) {
      Transforms.setNodes(
        editor,
        { url: linkEdit.url },
        {
          at: linkPath,
        }
      )
    }
    setLinkEdit(null)
    unpinOpen()
  }

  const cancel = () => {
    setLinkEdit(null)
    unpinOpen()
  }

  const remove = () => {
    Transforms.unwrapNodes(editor, {
      at: linkPath,
      match: isLinkElement,
    })
    setLinkEdit(null)
    unpinOpen()
  }

  const isEditing = linkEdit !== null && Path.equals(linkEdit.path, linkPath)
  const href = isEditing ? linkEdit.url : linkNode.url

  return isEditing ? (
    <>
      <Components.TextInput
        value={href}
        onChange={(url) =>
          setLinkEdit((prev) =>
            prev && Path.equals(prev.path, linkPath) ? { ...prev, url } : prev
          )
        }
        width="200px"
        onEnterPress={save}
      />
      <Components.Button variant="borderless" onClick={cancel}>
        Cancel
      </Components.Button>
      <Components.Button variant="borderless" onClick={save}>
        Save
      </Components.Button>
    </>
  ) : (
    <>
      <Components.LinkButton to={href} variant="borderless">
        <FontAwesomeIcon icon="arrow-up-right-from-square" size="xs" />{" "}
        {getHost(href)}
      </Components.LinkButton>
      <Components.Button
        variant="borderless"
        onClick={() => {
          pinOpen()
          setLinkEdit({ path: linkPath, url: linkNode.url })
        }}
      >
        <FontAwesomeIcon icon="pen-to-square" size="xs" /> Edit
      </Components.Button>
      <Components.Button variant="borderless" onClick={remove}>
        <FontAwesomeIcon icon="trash-can" size="xs" /> Remove
      </Components.Button>
    </>
  )
}

function getHost(url: string) {
  const match = url.match(/^https?:\/\/([^/]+)/)
  return match ? match[1] : url.slice(0, 15)
}
