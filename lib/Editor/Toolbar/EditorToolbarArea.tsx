import React, { useEffect, useMemo, useReducer, useRef, useState } from "react"
import { Editor, Element as SlateElement, Path, Range } from "slate"
import type { DOMPoint } from "slate-dom"
import { ReactEditor, useSlate, useSlateSelection } from "slate-react"
import { CreateLinkToolbar } from "./CreateLinkToolbar"
import { EditLinkToolbar } from "./EditLinkToolbars"
import { FormattingToolbarContent } from "./FormattingToolbar"
import type {
  LinkDraft,
  SlateEditor,
  ToolbarAction,
  ToolbarControls,
  ToolbarDescriptor,
  ToolbarMode,
} from "./types"
import { Toolbar } from "~/Components/Toolbar"
import * as toolbarAreaStyles from "~/Components/Toolbar.css"
import { isLinkElement } from "~/Editor/types"
import { isFormattableRange } from "~/helpers/range"

type EditorToolbarAreaProps = {
  children: React.ReactNode
}

export const EditorToolbarArea: React.FC<EditorToolbarAreaProps> = ({
  children,
}) => {
  const areaRef = useRef<HTMLDivElement>(null)
  const toolbarRootRef = useRef<HTMLDivElement | null>(null)
  const editor = useSlate() as SlateEditor
  const selection = useSlateSelection()
  const focused = ReactEditor.isFocused(editor)

  const [mode, dispatch] = useReducer(toolbarModeReducer, {
    kind: "none",
  } as ToolbarMode)
  const modeRef = useRef(mode)
  modeRef.current = mode

  const [hoverPath, setHoverPath] = useState<Path | null>(null)
  const hoverPathRef = useRef<Path | null>(null)
  const [isPointerOverDoc, setIsPointerOverDoc] = useState(false)

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

  useEffect(() => {
    let next: ToolbarMode = { kind: "none" }

    if (
      selection &&
      !Range.isCollapsed(selection) &&
      isFormattableRange(editor, selection)
    ) {
      let targetRect: DOMRect | undefined
      try {
        const domRange = ReactEditor.toDOMRange(editor, selection)
        const r =
          domRange.getClientRects()[0] ?? domRange.getBoundingClientRect()
        if (r && !(r.width === 0 && r.height === 0)) targetRect = r
      } catch {
        // toDOMRange can throw when the range no longer maps to the DOM
      }
      if (targetRect) {
        next = { kind: "formatting", range: selection, targetRect }
      }
    }

    if (next.kind === "none") {
      const effectiveHover = isPointerOverDoc ? hoverPath : null
      const linkPath = resolveToolbarLinkPath(editor, effectiveHover, caretPath)
      if (linkPath) {
        try {
          const [node] = Editor.node(editor, linkPath)
          if (isLinkElement(node)) {
            next = { kind: "linkHover", linkPath, linkNode: node }
          }
        } catch {
          // invalid path
        }
      }
    }

    dispatch({ type: "environmentChanged", next })
  }, [editor, selection, focused, hoverPath, isPointerOverDoc, caretPath])

  const controls = useMemo<ToolbarControls>(
    () => ({
      beginLinkDraft: (draft: LinkDraft) =>
        dispatch({ type: "beginLinkDraft", draft }),
      cancelLinkDraft: (restoreRange) =>
        dispatch({ type: "cancelLinkDraft", restoreRange }),
      saveLinkDraft: (linkPath, linkNode) =>
        dispatch({ type: "saveLinkDraft", linkPath, linkNode }),
      removeLinkDraft: () => dispatch({ type: "removeLinkDraft" }),
      beginLinkEdit: (linkPath, linkNode) =>
        dispatch({ type: "beginLinkEdit", linkPath, linkNode }),
      cancelLinkEdit: () => dispatch({ type: "cancelLinkEdit" }),
      saveLinkEdit: (linkPath, linkNode) =>
        dispatch({ type: "saveLinkEdit", linkPath, linkNode }),
      removeLink: () => dispatch({ type: "removeLink" }),
    }),
    [editor],
  )

  const matchedToolbar = modeToDescriptor(mode, editor, controls)

  const lastMatchRef = useRef<ToolbarDescriptor | null>(null)
  if (matchedToolbar) lastMatchRef.current = matchedToolbar

  return (
    <div ref={areaRef} className={toolbarAreaStyles.toolbarPositionRoot}>
      <Toolbar
        rootRef={toolbarRootRef}
        listenerAreaRef={areaRef}
        target={lastMatchRef.current?.target ?? undefined}
        open={matchedToolbar !== null}
        immediate={lastMatchRef.current?.immediate === true}
        content={lastMatchRef.current?.content}
      />
      {children}
    </div>
  )
}

function modeToDescriptor(
  mode: ToolbarMode,
  editor: SlateEditor,
  controls: ToolbarControls,
): ToolbarDescriptor | null {
  switch (mode.kind) {
    case "none":
      return null
    case "formatting":
      return {
        target: mode.targetRect,
        content: (
          <FormattingToolbarContent range={mode.range} controls={controls} />
        ),
      }
    case "linkDraft":
      return {
        target: mode.priorRect,
        immediate: true,
        content: <CreateLinkToolbar draft={mode.draft} controls={controls} />,
      }
    case "linkSaved": {
      let linkDom: HTMLElement
      try {
        linkDom = ReactEditor.toDOMNode(editor, mode.linkNode)
      } catch {
        return null
      }
      return {
        target: linkDom,
        immediate: true,
        content: (
          <EditLinkToolbar
            key={JSON.stringify(mode.linkPath)}
            linkPath={mode.linkPath}
            linkNode={mode.linkNode}
            editing={false}
            controls={controls}
          />
        ),
      }
    }
    case "linkHover": {
      let linkDom: HTMLElement
      try {
        linkDom = ReactEditor.toDOMNode(editor, mode.linkNode)
      } catch {
        return null
      }
      return {
        target: linkDom,
        content: (
          <EditLinkToolbar
            key={JSON.stringify(mode.linkPath)}
            linkPath={mode.linkPath}
            linkNode={mode.linkNode}
            editing={false}
            controls={controls}
          />
        ),
      }
    }
    case "linkEditing": {
      let linkDom: HTMLElement
      try {
        linkDom = ReactEditor.toDOMNode(editor, mode.linkNode)
      } catch {
        return null
      }
      return {
        target: linkDom,
        immediate: true,
        content: (
          <EditLinkToolbar
            key={JSON.stringify(mode.linkPath)}
            linkPath={mode.linkPath}
            linkNode={mode.linkNode}
            editing
            controls={controls}
          />
        ),
      }
    }
  }
}

function toolbarModeReducer(
  state: ToolbarMode,
  action: ToolbarAction,
): ToolbarMode {
  switch (action.type) {
    case "environmentChanged":
      // Ignore external environment signals while the user is actively editing or
      // during the one-tick grace period after link creation (linkSaved).
      if (
        state.kind === "linkDraft" ||
        state.kind === "linkEditing" ||
        state.kind === "linkSaved"
      )
        return state
      return toolbarModesEqual(state, action.next) ? state : action.next
    case "beginLinkDraft":
      if (state.kind !== "formatting") return state
      return {
        kind: "linkDraft",
        draft: action.draft,
        priorRect: state.targetRect,
      }
    case "cancelLinkDraft":
      if (state.kind !== "linkDraft") return state
      return {
        kind: "formatting",
        range: action.restoreRange,
        targetRect: state.priorRect,
      }
    case "saveLinkDraft":
      if (state.kind !== "linkDraft") {
        throw new Error(
          "Trying to create a link even though the CreateLinkToolbar is not open?",
        )
      }
      return {
        kind: "linkSaved",
        linkPath: action.linkPath,
        linkNode: action.linkNode,
      }
    case "removeLinkDraft":
      if (state.kind !== "linkDraft") {
        throw new Error(
          "Canceling link creation even though the CreateLinkToolbar is not open?",
        )
      }
      return { kind: "none" }
    case "beginLinkEdit":
      return {
        kind: "linkEditing",
        linkPath: action.linkPath,
        linkNode: action.linkNode,
      }
    case "cancelLinkEdit":
      if (state.kind !== "linkEditing") return state
      return {
        kind: "linkHover",
        linkPath: state.linkPath,
        linkNode: state.linkNode,
      }
    case "saveLinkEdit":
      return {
        kind: "linkHover",
        linkPath: action.linkPath,
        linkNode: action.linkNode,
      }
    case "removeLink":
      return { kind: "none" }
  }
}

function toolbarModesEqual(a: ToolbarMode, b: ToolbarMode): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === "none") return true
  if (a.kind === "formatting" && b.kind === "formatting") {
    return (
      Range.equals(a.range, b.range) &&
      rectsEqualEnough(a.targetRect, b.targetRect)
    )
  }
  if (a.kind === "linkDraft" && b.kind === "linkDraft") {
    return (
      Path.equals(a.draft.linkPath, b.draft.linkPath) &&
      a.draft.initialUrl === b.draft.initialUrl &&
      rectsEqualEnough(a.priorRect, b.priorRect)
    )
  }
  if (a.kind === "linkSaved" && b.kind === "linkSaved") {
    return Path.equals(a.linkPath, b.linkPath)
  }
  if (a.kind === "linkHover" && b.kind === "linkHover") {
    return Path.equals(a.linkPath, b.linkPath)
  }
  if (a.kind === "linkEditing" && b.kind === "linkEditing") {
    return Path.equals(a.linkPath, b.linkPath)
  }
  return false
}

function rectsEqualEnough(x: DOMRect, y: DOMRect): boolean {
  return (
    Math.abs(x.left - y.left) < 0.5 &&
    Math.abs(x.top - y.top) < 0.5 &&
    Math.abs(x.width - y.width) < 0.5 &&
    Math.abs(x.height - y.height) < 0.5
  )
}

function resolveToolbarLinkPath(
  editor: SlateEditor,
  hoverPath: Path | null,
  caretPath: Path | null,
): Path | null {
  for (const candidate of [hoverPath, caretPath]) {
    if (!candidate) continue
    const p = linkPathFromElementPath(editor, candidate)
    if (p) return p
  }
  return null
}

function linkPathFromElementPath(
  editor: SlateEditor,
  elementPath: Path,
): Path | null {
  try {
    const [node] = Editor.node(editor, elementPath)
    if (isLinkElement(node)) return elementPath

    const above = Editor.above(editor, {
      at: elementPath,
      match: isLinkElement,
      mode: "lowest",
    })
    return above ? above[1] : null
  } catch {
    return null
  }
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
  point: { path: Path; offset: number },
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

function pathsEqual(a: Path | null, b: Path | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return Path.equals(a, b)
}
