import React, { useCallback, useEffect, useRef, useState } from "react"
import { Editor, Path, Range } from "slate"
import type { DOMPoint } from "slate-dom"
import type { HistoryEditor } from "slate-history"
import { ReactEditor, useSlate, useSlateSelection } from "slate-react"
import { FormattingToolbarContent } from "./FormattingToolbarContent"
import { resolveFormattingChrome } from "./inlineChrome/resolveInlineChrome"
import { LinkToolbarContent } from "./LinkToolbarContent"
import { isLinkElement, type LinkElement as LinkElementNode } from "./types"
import { ToolbarArea } from "~/Components/ToolbarArea"

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

  const [hoverLinkPath, setHoverLinkPath] = useState<Path | null>(null)
  const hoverLinkPathRef = useRef<Path | null>(null)
  const [pinnedLinkPath, setPinnedLinkPath] = useState<Path | null>(null)

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
    }
  }, [pinnedLinkPath, pinStillValid])

  const activeLinkPath = (() => {
    if (pinnedLinkPath && isValidLinkPath(editor, pinnedLinkPath)) {
      return pinnedLinkPath
    }
    if (focused && caretLinkPath) return caretLinkPath
    return hoverLinkPath
  })()

  // TODO: Inline this
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

  let toolbar:
    | { target: Element | DOMRectReadOnly; content: React.ReactNode }
    | undefined

  if (showFormatting && activeRange && targetRect) {
    toolbar = {
      target: targetRect,
      content: <FormattingToolbarContent activeRange={activeRange} />,
    }
  } else if (activeLinkPath && isValidLinkPath(editor, activeLinkPath)) {
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

    toolbar = {
      target: linkDom,
      content: (
        <>
          <LinkToolbarContent
            key={JSON.stringify(activeLinkPath)}
            linkPath={activeLinkPath}
            linkNode={linkNode}
            pinOpen={pinOpen}
            unpinOpen={unpinOpen}
          />
        </>
      ),
    }
  }

  if (!toolbar) {
    return <>{children}</>
  }

  return (
    <ToolbarArea
      target={toolbar.target}
      open
      ref={toolbarListenerAreaRef}
      content={toolbar.content}
    >
      {children}
    </ToolbarArea>
  )
}
