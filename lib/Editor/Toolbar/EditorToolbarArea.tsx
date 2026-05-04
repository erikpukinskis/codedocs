import React, { useEffect, useMemo, useRef, useState } from "react"
import { Editor, Element as SlateElement, Path, Range, Transforms } from "slate"
import type { DOMPoint } from "slate-dom"
import { ReactEditor, useSlate, useSlateSelection } from "slate-react"
import { FormattingToolbarContent } from "./FormattingToolbar"
import {
  LinkDraftToolbarContent,
  LinkToolbarContent,
  wrapRangeAsLink,
} from "./LinkToolbar"
import type {
  LinkDraft,
  SlateEditor,
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

  const [mode, setMode] = useState<ToolbarMode>({ kind: "none" })

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
    setMode((prev) => {
      if (prev.kind === "linkDraft" || prev.kind === "linkEditing") {
        return prev
      }

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
          const next: ToolbarMode = {
            kind: "formatting",
            range: selection,
            targetRect,
          }
          return toolbarModesEqual(prev, next) ? prev : next
        }
      }

      const effectiveHover = isPointerOverDoc ? hoverPath : null
      const linkPath = resolveToolbarLinkPath(editor, effectiveHover, caretPath)

      if (linkPath) {
        try {
          const [node] = Editor.node(editor, linkPath)
          if (isLinkElement(node)) {
            const next: ToolbarMode = {
              kind: "linkHover",
              linkPath,
              linkNode: node,
            }
            return toolbarModesEqual(prev, next) ? prev : next
          }
        } catch {
          // invalid path
        }
      }

      const next: ToolbarMode = { kind: "none" }
      return toolbarModesEqual(prev, next) ? prev : next
    })
  }, [editor, selection, focused, hoverPath, isPointerOverDoc, caretPath])

  const controls = useMemo<ToolbarControls>(
    () => ({
      beginLinkDraft: (draft: LinkDraft) => {
        setMode((m) => {
          if (m.kind !== "formatting") return m
          return { kind: "linkDraft", draft, priorRect: m.targetRect }
        })
      },
      cancelLinkDraft: () => {
        setMode((m) => {
          if (m.kind !== "linkDraft") return m
          return {
            kind: "formatting",
            range: m.draft.range,
            targetRect: m.priorRect,
          }
        })
      },
      saveLinkDraft: (url: string) => {
        setMode((m) => {
          if (m.kind !== "linkDraft") return m
          wrapRangeAsLink(editor, m.draft.range, url)
          return { kind: "none" }
        })
      },
      removeLinkDraft: () => {
        setMode((m) => {
          if (m.kind !== "linkDraft") return m
          Transforms.unwrapNodes(editor, {
            at: m.draft.range,
            match: isLinkElement,
            split: true,
          })
          return { kind: "none" }
        })
      },
      beginLinkEdit: (path, node) => {
        setMode({ kind: "linkEditing", linkPath: path, linkNode: node })
      },
      cancelLinkEdit: () => {
        setMode((m) =>
          m.kind === "linkEditing"
            ? { kind: "linkHover", linkPath: m.linkPath, linkNode: m.linkNode }
            : m
        )
      },
      saveLinkEdit: () => {
        setMode((m) => {
          if (m.kind !== "linkEditing") return m
          try {
            const [node] = Editor.node(editor, m.linkPath)
            if (isLinkElement(node)) {
              return {
                kind: "linkHover",
                linkPath: m.linkPath,
                linkNode: node,
              }
            }
          } catch {
            // path invalid after edit
          }
          return { kind: "none" }
        })
      },
      removeLink: () => {
        setMode({ kind: "none" })
      },
    }),
    [editor]
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
  controls: ToolbarControls
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
        content: (
          <LinkDraftToolbarContent draft={mode.draft} controls={controls} />
        ),
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
          <LinkToolbarContent
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
          <LinkToolbarContent
            key={JSON.stringify(mode.linkPath)}
            linkPath={mode.linkPath}
            linkNode={mode.linkNode}
            editing
            controls={controls}
          />
        ),
      }
    }
    default:
      return null
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
      Range.equals(a.draft.range, b.draft.range) &&
      a.draft.initialUrl === b.draft.initialUrl &&
      rectsEqualEnough(a.priorRect, b.priorRect)
    )
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
  caretPath: Path | null
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
  elementPath: Path
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

function pathsEqual(a: Path | null, b: Path | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return Path.equals(a, b)
}
