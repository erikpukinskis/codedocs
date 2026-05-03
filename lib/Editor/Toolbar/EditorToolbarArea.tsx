import React, {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react"
import { Editor, Element as SlateElement, Path, Range } from "slate"
import type { DOMPoint } from "slate-dom"
import { ReactEditor, useSlate, useSlateSelection } from "slate-react"
import { matchFormattingToolbar } from "./FormattingToolbar"
import { matchLinkToolbar } from "./LinkToolbar"
import type {
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

  // When pinnedPath changes, ReactEditor.toDOMNode on the freshly created link
  // element fails during the render phase (DOM not committed yet). This bumps
  // a counter after every commit where pinnedPath changed, giving matchLinkToolbar
  // a second chance to resolve the DOM node.
  const [, retryAfterCommit] = useReducer((n: number) => n + 1, 0)
  useLayoutEffect(() => {
    if (pinnedPath !== null) retryAfterCommit()
  }, [pinnedPath])

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
      // Toolbar is outside Slate; toSlatePoint would clear hover and unmount the toolbar.
      if (toolbarRootRef.current?.contains(el)) {
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
  }

  const matchContext: MatchContext = {
    ...context,
    hoverPath,
    caretPath,
    pinnedPath,
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
