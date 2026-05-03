import React, { useEffect, useRef, useState } from "react"
import { Editor, Element as SlateElement, Path, Range } from "slate"
import type { DOMPoint } from "slate-dom"
import { ReactEditor, useSlate, useSlateSelection } from "slate-react"
import { matchFormattingToolbar } from "./FormattingToolbar"
import { matchLinkToolbar } from "./LinkToolbar"
import type {
  LinkDraft,
  MatchContext,
  SlateEditor,
  ToolbarContext,
  ToolbarDescriptor,
  ToolbarMatcher,
} from "./types"
import { Toolbar } from "~/Components/Toolbar"
import * as toolbarAreaStyles from "~/Components/Toolbar.css"

type EditorToolbarAreaProps = {
  ghostSelection: Range | undefined
  children: React.ReactNode
}

export const EditorToolbarArea: React.FC<EditorToolbarAreaProps> = ({
  ghostSelection,
  children,
}) => {
  const areaRef = useRef<HTMLDivElement>(null)
  const toolbarRootRef = useRef<HTMLDivElement | null>(null)
  const editor = useSlate() as SlateEditor
  const selection = useSlateSelection()
  const focused = ReactEditor.isFocused(editor)

  const [linkDraft, setLinkDraftState] = useState<LinkDraft | null>(null)

  const context: ToolbarContext = {
    editor,
    selection,
    focused,
    ghostSelection,
    areaRef,
    linkDraft,
  }

  const [hoverPath, setHoverPath] = useState<Path | null>(null)
  const hoverPathRef = useRef<Path | null>(null)
  const [pinnedPath, setPinnedPath] = useState<Path | null>(null)
  const [isPointerOverDoc, setIsPointerOverDoc] = useState(false)

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
        setIsPointerOverDoc(false)
        setHoverIfChanged(null)
        return
      }
      // Toolbar is outside Slate; toSlatePoint would clear hover and unmount the toolbar.
      if (toolbarRootRef.current?.contains(el)) {
        setIsPointerOverDoc(false)
        return
      }
      const domPoint = domPointFromClientXY(e.clientX, e.clientY)
      if (!domPoint || !area.contains(domPoint[0])) {
        setIsPointerOverDoc(false)
        setHoverIfChanged(null)
        return
      }
      const slatePoint = ReactEditor.toSlatePoint(editor, domPoint, {
        exactMatch: false,
        suppressThrow: true,
      })
      if (!slatePoint) {
        setIsPointerOverDoc(false)
        setHoverIfChanged(null)
        return
      }
      setIsPointerOverDoc(true)
      setHoverIfChanged(elementPathAtPoint(editor, slatePoint))
    }

    const onPointerLeave = () => {
      setIsPointerOverDoc(false)
      setHoverIfChanged(null)
    }

    area.addEventListener("pointermove", onPointerMove)
    area.addEventListener("pointerleave", onPointerLeave)
    return () => {
      area.removeEventListener("pointermove", onPointerMove)
      area.removeEventListener("pointerleave", onPointerLeave)
    }
  }, [editor])

  const caretPath =
    selection == null || !focused || !Range.isCollapsed(selection)
      ? null
      : elementPathAtPoint(editor, selection.anchor)

  const controls = {
    pinPath: (path: Path) => {
      if (!isValidElementPath(editor, path)) return
      setPinnedPath(path)
    },
    clearPinnedPath: () => {
      setPinnedPath(null)
    },
    setLinkDraft: (draft: LinkDraft) => {
      setLinkDraftState(draft)
    },
    clearLinkDraft: () => {
      setLinkDraftState(null)
    },
  }

  const matchContext: MatchContext = {
    ...context,
    hoverPath,
    caretPath,
    pinnedPath,
    isPointerOverDoc,
    controls,
  }

  const matchers: ToolbarMatcher[] = [matchFormattingToolbar, matchLinkToolbar]

  let matchedToolbar: ToolbarDescriptor | null = null
  for (const matcher of matchers) {
    const toolbar = matcher(matchContext)

    if (!toolbar) {
      continue
    }

    matchedToolbar = toolbar
    break
  }

  return (
    <div ref={areaRef} className={toolbarAreaStyles.toolbarPositionRoot}>
      {matchedToolbar && (
        <Toolbar
          rootRef={toolbarRootRef}
          listenerAreaRef={areaRef}
          target={matchedToolbar.target}
          open
          immediate={matchedToolbar.immediate === true}
          content={matchedToolbar.content}
        />
      )}
      {children}
    </div>
  )
}

function domPointFromClientXY(x: number, y: number): DOMPoint | null {
  const pos = document.caretPositionFromPoint?.(x, y)
  if (pos) return [pos.offsetNode, pos.offset]

  const range = document.caretRangeFromPoint?.(x, y)
  if (!range) return null

  return [range.startContainer, range.startOffset]
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
    mode: "lowest",
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
