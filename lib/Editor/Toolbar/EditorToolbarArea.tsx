import React, { useEffect, useRef, useState } from "react"
import { Editor, Element as SlateElement, Path, Range } from "slate"
import type { DOMPoint } from "slate-dom"
import { ReactEditor, useSlate, useSlateSelection } from "slate-react"
import { matchFormattingToolbar } from "./FormattingToolbar"
import { matchLinkToolbar } from "./LinkToolbar"
import type {
  MatchContext,
  SlateEditor,
  ToolbarContext,
  ToolbarMatcher,
} from "./types"
import { ToolbarArea } from "~/Components/ToolbarArea"

type EditorToolbarAreaProps = {
  ghostSelection: Range | undefined
  children: React.ReactNode
}

export const EditorToolbarArea: React.FC<EditorToolbarAreaProps> = ({
  ghostSelection,
  children,
}) => {
  const areaRef = useRef<HTMLDivElement>(null)
  const editor = useSlate() as SlateEditor
  const selection = useSlateSelection()
  const focused = ReactEditor.isFocused(editor)

  const context: ToolbarContext = {
    editor,
    selection,
    focused,
    ghostSelection,
    areaRef,
  }

  const [hoverPath, setHoverPath] = useState<Path | null>(null)
  const hoverPathRef = useRef<Path | null>(null)
  const [pinnedPath, setPinnedPath] = useState<Path | null>(null)

  useEffect(() => {
    if (pinnedPath !== null && !isValidElementPath(editor, pinnedPath)) {
      setPinnedPath(null)
    }
  }, [editor, pinnedPath])

  useEffect(() => {
    const area = areaRef.current
    if (!area) return

    const setHoverIfChanged = (next: Path | null) => {
      if (pathsEqual(hoverPathRef.current, next)) return
      hoverPathRef.current = next
      setHoverPath(next)
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
      setHoverIfChanged(elementPathAtPoint(editor, slatePoint))
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

  const pathAtCaret =
    selection == null || !focused || !Range.isCollapsed(selection)
      ? null
      : elementPathAtPoint(editor, selection.anchor)

  const activePath = (() => {
    if (pinnedPath && isValidElementPath(editor, pinnedPath)) return pinnedPath
    if (focused && pathAtCaret) return pathAtCaret
    return hoverPath
  })()

  const controls = {
    pinOpen: () => {
      if (activePath) setPinnedPath(activePath)
    },
    unpinOpen: () => {
      setPinnedPath(null)
    },
  }

  const matchContext: MatchContext = {
    ...context,
    hoverPath,
    activePath,
    pinnedPath,
    controls,
  }

  const matchers: ToolbarMatcher[] = [matchFormattingToolbar, matchLinkToolbar]

  for (const matcher of matchers) {
    const toolbar = matcher(matchContext)

    if (!toolbar) {
      continue
    }

    return (
      <ToolbarArea
        target={toolbar.target}
        open
        ref={areaRef}
        content={toolbar.content}
      >
        {children}
      </ToolbarArea>
    )
  }

  return <>{children}</>
}

function domPointFromClientXY(x: number, y: number): DOMPoint | null {
  const pos = document.caretPositionFromPoint?.(x, y)
  if (!pos) return null
  return [pos.offsetNode, pos.offset]
}

function elementPathAtPoint(
  editor: SlateEditor,
  point: { path: Path; offset: number }
): Path | null {
  const above = Editor.above(editor, {
    at: point,
    match: (node) =>
      SlateElement.isElement(node) &&
      (Editor.isBlock(editor, node) || Editor.isInline(editor, node)),
  })
  return above ? above[1] : null
}

function isValidElementPath(editor: SlateEditor, path: Path): boolean {
  try {
    const [node] = Editor.node(editor, path)
    return SlateElement.isElement(node)
  } catch {
    return false
  }
}

function pathsEqual(a: Path | null, b: Path | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return Path.equals(a, b)
}
