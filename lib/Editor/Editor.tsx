import React, { useCallback, useLayoutEffect, useRef, useState } from "react"
import {
  createEditor,
  Editor,
  Element,
  Path,
  Range,
  Text,
  Transforms,
} from "slate"
import type { Element as SlateElement, NodeEntry } from "slate"
import { withHistory, type HistoryEditor } from "slate-history"
import {
  Editable,
  ReactEditor,
  Slate,
  withReact,
  useFocused,
  useSelected,
  useSlate,
} from "slate-react"
import type { RenderElementProps, RenderLeafProps } from "slate-react"
import { copyHtml, copyPlainText } from "./copy"
import {
  DemoSourceVisibilityProvider,
  useDemoSourceVisibility,
  type DemoSourceVisibility,
} from "./DemoSourceVisibilityContext"
import * as styles from "./Editor.css"
import { EditorToolbarArea } from "./Toolbar/EditorToolbarArea"
import {
  isCodeBlock,
  isFrozenBlock,
  isHeadingBlock,
  isLineOfCodeElement,
  isLinkElement,
  isListItemBlock,
  isParagraphBlock,
  isSlateBlock,
  type ListItemBlock,
  type SlateBlock,
} from "./types"

/** Block types that can host inline frozen voids beside text leaves. */
function isHostBlockForInlineFrozen(node: unknown): node is SlateElement {
  return (
    Element.isElement(node) &&
    (node.type === "paragraph" ||
      node.type === "heading" ||
      node.type === "list-item")
  )
}

function newParagraphBlock(): SlateBlock {
  return {
    type: "paragraph",
    id: `b${Date.now()}`,
    children: [{ text: "" }],
  } as SlateBlock
}

/**
 * If the user types into the empty text leaf directly before or after an inline
 * frozen void, move that text into a new block-level paragraph so the frozen
 * stays alone on its line (modulo required placeholder leaves).
 */
function redirectTypingFromFrozenAdjacentEmptyLeaf(
  editor: ReactEditor & HistoryEditor,
  text: string,
  baseInsertText: (t: string) => void
): boolean {
  const { selection } = editor
  if (!selection || !Range.isCollapsed(selection)) return false

  const { path, offset } = selection.anchor
  const textNodeEntry = Editor.node(editor, path)
  if (!Text.isText(textNodeEntry[0])) return false
  const [leaf] = textNodeEntry
  if (leaf.text !== "" || offset !== 0) return false

  const parentEntry = Editor.parent(editor, path)
  const [parentNode, parentPath] = parentEntry
  if (!isHostBlockForInlineFrozen(parentNode)) return false

  const index = path[path.length - 1]
  if (index === undefined) return false
  const children = parentNode.children
  const next = children[index + 1]
  const prev = children[index - 1]
  const nextIsFrozen = next !== undefined && isFrozenBlock(next)
  const prevIsFrozen = prev !== undefined && isFrozenBlock(prev)

  if (nextIsFrozen && prevIsFrozen) return false

  if (nextIsFrozen) {
    Transforms.insertNodes(editor, newParagraphBlock(), { at: parentPath })
    const shiftedBlockPath = Path.next(parentPath)
    Transforms.select(editor, { path: [...parentPath, 0], offset: 0 })
    baseInsertText(text)
    const [shifted] = Editor.node(editor, shiftedBlockPath)
    if (
      Element.isElement(shifted) &&
      shifted.children[0] &&
      Text.isText(shifted.children[0]) &&
      shifted.children[0].text === "" &&
      shifted.children[1] &&
      isFrozenBlock(shifted.children[1])
    ) {
      Transforms.removeNodes(editor, { at: [...shiftedBlockPath, 0] })
    }
    return true
  }

  if (prevIsFrozen) {
    const insertPath = Path.next(parentPath)
    Transforms.insertNodes(editor, newParagraphBlock(), { at: insertPath })
    Transforms.select(editor, { path: [...insertPath, 0], offset: 0 })
    baseInsertText(text)
    const [block] = Editor.node(editor, parentPath)
    if (!Element.isElement(block)) return true
    const len = block.children.length
    if (len < 2) return true
    const last = block.children[len - 1]
    const secondLast = block.children[len - 2]
    if (
      secondLast !== undefined &&
      Text.isText(last) &&
      last.text === "" &&
      isFrozenBlock(secondLast)
    ) {
      Transforms.removeNodes(editor, { at: [...parentPath, len - 1] })
    }
    return true
  }

  return false
}

/** Adjacent list-items with the same listType are one visual list (depth may vary). */
function isSameListSequence(
  sibling: SlateBlock | undefined,
  node: ListItemBlock
): sibling is ListItemBlock {
  return (
    sibling !== undefined &&
    isListItemBlock(sibling) &&
    sibling.listType === node.listType
  )
}

/** First/last among consecutive list-items with matching listType (depth ignored). */
function getListItemRunEdgeFlags(
  editor: ReactEditor & HistoryEditor,
  path: Path,
  node: ListItemBlock
): { isFirstInRun: boolean; isLastInRun: boolean } {
  const [parent] = Editor.parent(editor, path)

  let siblings: SlateBlock[]
  let index: number

  if (Editor.isEditor(parent)) {
    siblings = parent.children as SlateBlock[]
    const i = path[0]
    if (i === undefined) {
      return { isFirstInRun: true, isLastInRun: true }
    }
    index = i
  } else if (Element.isElement(parent)) {
    siblings = parent.children as SlateBlock[]
    const i = path[path.length - 1]
    if (i === undefined) {
      return { isFirstInRun: true, isLastInRun: true }
    }
    index = i
  } else {
    return { isFirstInRun: true, isLastInRun: true }
  }

  const prevSibling = index > 0 ? siblings[index - 1] : undefined
  const nextSibling =
    index < siblings.length - 1 ? siblings[index + 1] : undefined

  const isFirstInRun = !isSameListSequence(prevSibling, node)
  const isLastInRun = !isSameListSequence(nextSibling, node)

  return { isFirstInRun, isLastInRun }
}

function convertListItemToParagraph(
  editor: ReactEditor & HistoryEditor,
  path: Path
) {
  Transforms.unsetNodes(editor, ["listType", "depth"], { at: path })
  Transforms.setNodes(editor, { type: "paragraph" } as Partial<SlateBlock>, {
    at: path,
  })
}

/** Move root block's children into an empty preceding list item and remove the block. */
function mergeRootBlockIntoEmptyPrecedingListItem(
  editor: ReactEditor & HistoryEditor,
  emptyListPath: Path,
  sourceBlockPath: Path
) {
  const [listItem] = Editor.node(editor, emptyListPath)
  const [sourceBlock] = Editor.node(editor, sourceBlockPath)
  if (!Element.isElement(listItem) || !Element.isElement(sourceBlock)) return

  const copies = sourceBlock.children.map((c) => structuredClone(c))

  Editor.withoutNormalizing(editor, () => {
    for (let i = listItem.children.length - 1; i >= 0; i--) {
      Transforms.removeNodes(editor, { at: [...emptyListPath, i] })
    }
    for (let i = 0; i < copies.length; i++) {
      const child = copies[i]
      if (child !== undefined) {
        Transforms.insertNodes(editor, child, { at: [...emptyListPath, i] })
      }
    }
    Transforms.removeNodes(editor, { at: sourceBlockPath })
  })

  Transforms.select(editor, Editor.start(editor, emptyListPath))
}

/**
 * For a frozen block at root index `frozenIdx`, returns the [start, endExclusive)
 * range covering all immediately-following root-level code-blocks that share
 * the same `demoId`. The returned range INCLUDES the frozen block.
 *
 * The macro emits frozen + sibling demo source code-blocks contiguously. We
 * treat them as a single "demo cluster" for delete/cut/paste-over operations.
 */
function getDemoClusterRange(
  editor: Editor,
  frozenIdx: number,
  demoId: string
): { start: number; end: number } {
  let end = frozenIdx + 1
  while (end < editor.children.length) {
    const sibling = editor.children[end]
    if (sibling && isCodeBlock(sibling) && sibling.demoId === demoId) {
      end++
      continue
    }
    break
  }
  return { start: frozenIdx, end }
}

/**
 * For a code-block at root index `idx` that has a `demoId`, walks BACKWARDS
 * to find the host paragraph containing the matching frozen block, and
 * FORWARDS to include all sibling demoId code-blocks. Returns the cluster
 * range. Returns null if the matching frozen can't be located adjacent.
 */
function getDemoClusterRangeFromCodeBlock(
  editor: Editor,
  idx: number,
  demoId: string
): { start: number; end: number } | null {
  let start = idx - 1
  while (start >= 0) {
    const candidate = editor.children[start]
    if (!candidate) return null
    if (isCodeBlock(candidate) && candidate.demoId === demoId) {
      start--
      continue
    }
    if (containsFrozenWithId(candidate, demoId)) {
      return getDemoClusterRange(editor, start, demoId)
    }
    return null
  }
  return null
}

function containsFrozenWithId(node: unknown, demoId: string): boolean {
  if (!Element.isElement(node)) return false
  for (const child of node.children) {
    if (isFrozenBlock(child) && child.id === demoId) return true
  }
  return false
}

/**
 * If `range` touches a frozen block (or a code-block in a demo cluster),
 * extends the range to span the WHOLE cluster (frozen + all sibling demoId
 * code-blocks). Used to make cut / delete / paste-over operate atomically on
 * a demo as a unit.
 *
 * The user's selection is left alone; only the operation's effective range is
 * widened.
 */
function expandRangeForDemoCluster(editor: Editor, range: Range): Range {
  let result = range

  // Walk every block in the original range; when we hit a frozen or a demoId
  // code-block, expand `result` to include the full cluster.
  for (const [node, path] of Editor.nodes(editor, {
    at: range,
    match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
  })) {
    const rootIdx = path[0]
    if (rootIdx === undefined) continue

    let cluster: { start: number; end: number } | null = null

    if (isFrozenBlock(node)) {
      // Frozen lives inside a paragraph; the paragraph index is the cluster start.
      const paragraphIdx = path[0]
      if (paragraphIdx === undefined) continue
      cluster = getDemoClusterRange(editor, paragraphIdx, node.id)
    } else if (isCodeBlock(node)) {
      const demoId: string | undefined = node.demoId
      if (demoId === undefined) continue
      cluster = getDemoClusterRangeFromCodeBlock(editor, rootIdx, demoId)
    } else if (Element.isElement(node)) {
      // Walk inline children for an inline frozen.
      for (const child of node.children) {
        if (isFrozenBlock(child)) {
          cluster = getDemoClusterRange(editor, rootIdx, child.id)
          break
        }
      }
    }

    if (!cluster) continue

    const clusterStart = Editor.start(editor, [cluster.start])
    const clusterEnd = Editor.end(editor, [cluster.end - 1])

    const [resultStart, resultEnd] = Range.edges(result)
    const newStart =
      Path.compare(clusterStart.path, resultStart.path) < 0
        ? clusterStart
        : resultStart
    const newEnd =
      Path.compare(clusterEnd.path, resultEnd.path) > 0 ? clusterEnd : resultEnd

    result = { anchor: newStart, focus: newEnd }
  }

  return result
}

/**
 * Arrow-key navigation skip across hidden demo source code-blocks.
 *
 * When the user presses an arrow key, examines the next/previous root block
 * relative to the current selection. If that block is a HIDDEN demoId code-
 * block, advances past the entire hidden cluster (which may be multiple
 * code-blocks for the same demo with different tabs) and lands the caret at
 * the start (forward) or end (backward) of the first VISIBLE block beyond.
 *
 * Returns true if a skip was performed (caller should preventDefault), false
 * to let normal navigation run.
 */
function skipPastHiddenClusterIfNeeded(
  editor: Editor,
  visibility: DemoSourceVisibility,
  key: "ArrowDown" | "ArrowUp" | "ArrowRight" | "ArrowLeft"
): boolean {
  const { selection } = editor
  if (!selection) return false
  const direction: "forward" | "backward" =
    key === "ArrowDown" || key === "ArrowRight" ? "forward" : "backward"

  const { anchor } = selection
  const blockEntry = Editor.above(editor, {
    at: anchor,
    match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
  })
  if (!blockEntry) return false
  const [, blockPath] = blockEntry
  const rootIdx = blockPath[0]
  if (rootIdx === undefined) return false

  // Only act at the boundary that the arrow key would actually leave the
  // current block from. Otherwise the within-block cursor movement is fine.
  if (direction === "forward") {
    if (!Editor.isEnd(editor, anchor, blockPath)) {
      // For ArrowDown specifically, we still want to skip if the next visual
      // line (i.e. the next block) is hidden. But "Editor.isEnd" being false
      // means there are still positions within this block to visit. Let
      // normal browser behavior handle visual movement; only the boundary
      // case needs intercepting.
      if (key === "ArrowRight" || key === "ArrowLeft") return false
      // ArrowDown at non-bottom of a multi-line block: leave alone.
      if (key === "ArrowDown") return false
    }
  } else {
    if (!Editor.isStart(editor, anchor, blockPath)) {
      if (key === "ArrowRight" || key === "ArrowLeft") return false
      if (key === "ArrowUp") return false
    }
  }

  const step = direction === "forward" ? 1 : -1
  let idx = rootIdx + step

  // Walk past contiguous hidden code-blocks; if we find any hidden block,
  // continue until we hit a visible block or the document edge. If the very
  // next block is NOT a hidden code-block, no skip is needed.
  let skippedAny = false
  while (idx >= 0 && idx < editor.children.length) {
    const node = editor.children[idx]
    if (!node) break
    if (isCodeBlock(node)) {
      const demoId: string | undefined = node.demoId
      const tab: string | undefined = node.tab
      if (
        demoId !== undefined &&
        tab !== undefined &&
        !visibility.isVisible(demoId, tab)
      ) {
        skippedAny = true
        idx += step
        continue
      }
    }
    break
  }

  if (!skippedAny) return false

  // Land on the appropriate edge of the destination block (or the doc edge).
  if (direction === "forward") {
    if (idx >= editor.children.length) {
      // No visible block after; stay put.
      return true
    }
    Transforms.select(editor, Editor.start(editor, [idx]))
  } else {
    if (idx < 0) {
      return true
    }
    Transforms.select(editor, Editor.end(editor, [idx]))
  }
  return true
}

type DocEditorProps = {
  slateDocument: SlateElement[]
  frozenElements: Record<string, React.ReactNode>
  frozenSources?: Record<string, string>
}

/**
 * Wraps DocEditorInner with the visibility provider so the inner component's
 * hooks (renderElement, onKeyDown) can read visibility synchronously and
 * react to changes via standard context invalidation.
 */
export const DocEditor: React.FC<DocEditorProps> = (props) => (
  <DemoSourceVisibilityProvider>
    <DocEditorInner {...props} />
  </DemoSourceVisibilityProvider>
)

const DocEditorInner = ({
  slateDocument,
  frozenElements,
  frozenSources,
}: DocEditorProps) => {
  const frozenSourcesRef = useRef(frozenSources)
  frozenSourcesRef.current = frozenSources

  // Lazy ref so the same editor instance survives Fast Refresh / re-renders; useMemo
  // would recreate when this module hot-reloads.
  const editorRef = useRef<(ReactEditor & HistoryEditor) | null>(null)
  if (editorRef.current === null) {
    const editor = withHistory(withReact(createEditor()))
    editor.isInline = (element) =>
      isLinkElement(element) || isFrozenBlock(element)
    const { isVoid, normalizeNode } = editor
    editor.isVoid = (element) =>
      isFrozenBlock(element) ? true : isVoid(element)

    editor.normalizeNode = (entry) => {
      const [node, path] = entry
      if (Editor.isEditor(node)) {
        for (const [child, childPath] of Editor.nodes(editor, {
          at: path,
          mode: "highest",
          match: (n) => !Editor.isEditor(n),
        })) {
          if (
            Text.isText(child) ||
            (isSlateBlock(child) && editor.isInline(child))
          ) {
            Transforms.wrapNodes(
              editor,
              {
                type: "paragraph",
                id: `b${Date.now()}`,
                children: [],
              } as SlateBlock,
              { at: childPath }
            )
            return
          }
        }
      }
      normalizeNode(entry)
    }

    const baseInsertText = editor.insertText.bind(editor)
    editor.insertText = (text) => {
      if (
        redirectTypingFromFrozenAdjacentEmptyLeaf(editor, text, baseInsertText)
      ) {
        return
      }
      baseInsertText(text)
    }

    // Cluster-aware delete: when the user's selection touches a frozen block
    // or a demo-source code-block, expand the operation range to the WHOLE
    // demo cluster (frozen + sibling demoId code-blocks). This makes
    // selection-delete, cut, and paste-over treat a demo as one indivisible
    // unit. The selection itself stays exactly as Slate computes it.
    const baseDeleteFragment = editor.deleteFragment.bind(editor)
    editor.deleteFragment = (direction) => {
      const { selection } = editor
      if (!selection || Range.isCollapsed(selection)) {
        baseDeleteFragment(direction)
        return
      }
      const expanded = expandRangeForDemoCluster(editor, selection)
      if (Range.equals(expanded, selection)) {
        baseDeleteFragment(direction)
        return
      }
      Editor.withoutNormalizing(editor, () => {
        Transforms.select(editor, expanded)
        baseDeleteFragment(direction)
      })
    }

    // Inviolability guards: forbid backspace/delete from MERGING a demoId
    // code-block with whatever is on the other side. Within-block edits
    // (typing, single Enter, single-character delete) are unaffected because
    // they don't cross the block boundary.
    const baseDeleteBackward = editor.deleteBackward.bind(editor)
    editor.deleteBackward = (unit) => {
      const { selection } = editor
      if (selection && Range.isCollapsed(selection)) {
        const blockEntry = Editor.above(editor, {
          match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
        })
        if (blockEntry) {
          const [block, blockPath] = blockEntry
          // At the start of a demoId code-line: would merge with previous
          // line or (at line 0) try to merge the code-block backwards. The
          // first case is fine (within-block). The second crosses the
          // boundary — forbid it.
          if (
            Editor.isStart(editor, selection.anchor, blockPath) &&
            isLineOfCodeElement(block)
          ) {
            const codeBlockEntry = Editor.parent(editor, blockPath)
            const [codeBlockNode] = codeBlockEntry
            if (
              isCodeBlock(codeBlockNode) &&
              codeBlockNode.demoId !== undefined
            ) {
              const lineIdx = blockPath[blockPath.length - 1]
              if (lineIdx === 0) return
            }
          }
          // At the start of any block immediately AFTER a demoId code-block
          // (i.e. a paragraph below the demo): would pull our content into
          // the code-block. Forbid.
          if (Editor.isStart(editor, selection.anchor, blockPath)) {
            const rootIdx = blockPath[0]
            if (rootIdx !== undefined && rootIdx > 0) {
              const prev = editor.children[rootIdx - 1]
              if (prev && isCodeBlock(prev) && prev.demoId !== undefined) {
                return
              }
            }
          }
        }
      }
      baseDeleteBackward(unit)
    }

    const baseDeleteForward = editor.deleteForward.bind(editor)
    editor.deleteForward = (unit) => {
      const { selection } = editor
      if (selection && Range.isCollapsed(selection)) {
        const blockEntry = Editor.above(editor, {
          match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
        })
        if (blockEntry) {
          const [block, blockPath] = blockEntry
          if (
            Editor.isEnd(editor, selection.anchor, blockPath) &&
            isLineOfCodeElement(block)
          ) {
            const codeBlockEntry = Editor.parent(editor, blockPath)
            const [codeBlockNode] = codeBlockEntry
            if (
              isCodeBlock(codeBlockNode) &&
              codeBlockNode.demoId !== undefined
            ) {
              const lineIdx = blockPath[blockPath.length - 1]
              const lastLineIdx = codeBlockNode.children.length - 1
              if (lineIdx === lastLineIdx) {
                // Would merge code-block end with whatever follows. Forbid.
                return
              }
            }
          }
          if (Editor.isEnd(editor, selection.anchor, blockPath)) {
            const rootIdx = blockPath[0]
            if (rootIdx !== undefined) {
              const next = editor.children[rootIdx + 1]
              if (next && isCodeBlock(next) && next.demoId !== undefined) {
                return
              }
            }
          }
        }
      }
      baseDeleteForward(unit)
    }

    const defaultSetFragmentData = editor.setFragmentData.bind(editor)

    editor.setFragmentData = (data: DataTransfer) => {
      // Still set application/x-slate-fragment, text/html, etc. from Slate.
      defaultSetFragmentData(data)
      const { selection } = editor
      if (!selection || Range.isCollapsed(selection)) return
      // Always derive text/plain from the document (see clipboardPlainTextForRange).
      const text = copyPlainText(editor, selection, frozenSourcesRef.current)
      const html = copyHtml(editor, selection, frozenSourcesRef.current)
      data.setData("text/plain", text)
      data.setData("text/html", html)

      // const fragment = Editor.fragment(editor, selection)
      // const slateMime = data.getData("application/x-slate-fragment")
      // console.debug("Copied HTML to clipboard:")
      // console.debug(html)
    }

    editorRef.current = editor
  }
  const editor = editorRef.current
  const [value, setValue] = useState(slateDocument)
  const [ghostSelection, setGhostSelection] = useState<Range | undefined>()
  const [isFocused, setIsFocused] = useState(false)

  // Slate assigns `editor.children = initialValue` on first mount without running
  // normalization. Root-level inline frozens from the macro must be wrapped before
  // caret placement works; `force` walks the full tree once.
  useLayoutEffect(() => {
    Editor.normalize(editor, { force: true })
    setValue(editor.children as SlateBlock[])
  }, [editor])

  // Visibility for demo-source code-blocks — set inside the
  // DemoSourceVisibilityProvider that wraps DocEditor. Arrow-key navigation
  // uses this to skip past hidden cluster blocks; CodeBlockElement reads it
  // directly via the hook for render-time hiding.
  const visibility = useDemoSourceVisibility()

  const renderElement = useCallback(
    (props: RenderElementProps) => (
      <DocElement {...props} frozenElements={frozenElements} />
    ),
    [frozenElements]
  )

  const renderLeaf = useCallback(
    (
      props: Omit<RenderLeafProps, "children"> & { children: React.ReactNode }
    ) => {
      let { children: leafChildren } = props
      if (props.leaf.code) leafChildren = <code>{leafChildren}</code>
      if (props.leaf.strikethrough) leafChildren = <s>{leafChildren}</s>
      if (props.leaf.underline) leafChildren = <u>{leafChildren}</u>
      if (props.leaf.bold) leafChildren = <strong>{leafChildren}</strong>
      if (props.leaf.italic) leafChildren = <em>{leafChildren}</em>
      const leafClassName = [
        props.leaf.ghostSelection ? styles.ghostSelection : null,
        props.leaf.text === "" ? styles.emptyTextLeaf : null,
      ]
        .filter(Boolean)
        .join(" ")

      return (
        <span {...props.attributes} className={leafClassName || undefined}>
          {leafChildren}
        </span>
      )
    },
    []
  )

  const decorate = useCallback(
    ([node, path]: NodeEntry): Range[] => {
      if (isFocused || !ghostSelection || !Text.isText(node)) return []

      try {
        const intersection = Range.intersection(
          ghostSelection,
          Editor.range(editor, path)
        )
        if (!intersection) return []
        return [{ ...intersection, ghostSelection: true } as Range]
      } catch {
        return []
      }
    },
    [editor, ghostSelection, isFocused]
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Arrow-key skip: when navigating across blocks, hop OVER hidden demo
      // source code-blocks so the cursor never lands inside them. Only the
      // simple non-shift case is handled here; shift-arrow extends selection
      // and Slate's normal behavior is acceptable (selecting hidden blocks
      // can't actually show anything but is safe).
      if (
        !event.shiftKey &&
        editor.selection &&
        Range.isCollapsed(editor.selection) &&
        (event.key === "ArrowDown" ||
          event.key === "ArrowUp" ||
          event.key === "ArrowRight" ||
          event.key === "ArrowLeft")
      ) {
        const skipped = skipPastHiddenClusterIfNeeded(
          editor,
          visibility,
          event.key
        )
        if (skipped) {
          event.preventDefault()
          return
        }
      }

      if (
        event.key === "ArrowRight" &&
        !event.shiftKey &&
        editor.selection &&
        Range.isCollapsed(editor.selection)
      ) {
        const { path, offset } = editor.selection.anchor
        const [node] = Editor.node(editor, path)
        if (Text.isText(node) && offset === node.text.length) {
          const nextNodeEntry = Editor.next(editor, { at: path })
          if (nextNodeEntry) {
            const [nextNode, nextPath] = nextNodeEntry
            if (isFrozenBlock(nextNode)) {
              event.preventDefault()
              const afterVoidEntry = Editor.next(editor, { at: nextPath })
              if (afterVoidEntry) {
                Transforms.select(editor, {
                  path: afterVoidEntry[1],
                  offset: 0,
                })
                return
              }
            }
          }
        }
      }

      if (
        event.key === "ArrowLeft" &&
        !event.shiftKey &&
        editor.selection &&
        Range.isCollapsed(editor.selection)
      ) {
        const { path, offset } = editor.selection.anchor
        if (offset === 0) {
          const prevNodeEntry = Editor.previous(editor, { at: path })
          if (prevNodeEntry) {
            const [prevNode, prevPath] = prevNodeEntry
            if (isFrozenBlock(prevNode)) {
              event.preventDefault()
              const beforeVoidEntry = Editor.previous(editor, { at: prevPath })
              if (beforeVoidEntry) {
                const [beforeNode] = beforeVoidEntry
                if (Text.isText(beforeNode)) {
                  Transforms.select(editor, {
                    path: beforeVoidEntry[1],
                    offset: beforeNode.text.length,
                  })
                  return
                }
              }
            }
          }
        }
      }

      if (
        event.key === "Backspace" &&
        editor.selection &&
        Range.isCollapsed(editor.selection)
      ) {
        const { anchor } = editor.selection
        const blockPath = anchor.path.slice(0, 1) as Path
        const [block] = Editor.node(editor, blockPath)

        if (
          isListItemBlock(block) &&
          Editor.isStart(editor, anchor, blockPath)
        ) {
          const rootIdx = blockPath[0]
          const prevIsListItem =
            rootIdx !== undefined &&
            rootIdx > 0 &&
            isListItemBlock(Editor.node(editor, [rootIdx - 1])[0])
          if (!prevIsListItem) {
            event.preventDefault()
            convertListItemToParagraph(editor, blockPath)
            return
          }
        }

        if (isParagraphBlock(block) || isHeadingBlock(block)) {
          const rootIdx = blockPath[0]
          if (
            rootIdx !== undefined &&
            rootIdx > 0 &&
            Editor.isStart(editor, anchor, blockPath)
          ) {
            const prevPath: Path = [rootIdx - 1]
            const [prev] = Editor.node(editor, prevPath)
            if (
              isListItemBlock(prev) &&
              Editor.string(editor, prevPath).trim() === ""
            ) {
              event.preventDefault()
              mergeRootBlockIntoEmptyPrecedingListItem(
                editor,
                prevPath,
                blockPath
              )
              return
            }
          }
        }
      }

      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault()
        editor.insertText("\n")
        return
      }

      const [codeLineMatch] = Editor.nodes(editor, {
        match: isLineOfCodeElement,
      })

      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !codeLineMatch &&
        editor.selection &&
        Range.isCollapsed(editor.selection)
      ) {
        const { anchor } = editor.selection

        const headingEntry = Editor.above(editor, {
          match: isHeadingBlock,
        })
        if (headingEntry) {
          const [, headingPath] = headingEntry
          if (Editor.isEnd(editor, anchor, headingPath)) {
            const rootIdx = headingPath[0]
            if (rootIdx !== undefined) {
              event.preventDefault()
              Transforms.insertNodes(editor, newParagraphBlock(), {
                at: [rootIdx + 1],
              })
              Transforms.select(editor, Editor.start(editor, [rootIdx + 1]))
              return
            }
          }
        }

        const listEntry = Editor.above(editor, {
          match: isListItemBlock,
        })
        if (listEntry) {
          const [, listPath] = listEntry
          const listText = Editor.string(editor, listPath)

          if (listText.trim() === "") {
            event.preventDefault()
            convertListItemToParagraph(editor, listPath)
            Transforms.select(editor, Editor.start(editor, listPath))
            return
          }

          if (Editor.isStart(editor, anchor, listPath)) {
            const rootIdx = listPath[0]
            if (rootIdx !== undefined && rootIdx > 0) {
              const prevPath: Path = [rootIdx - 1]
              const [prev] = Editor.node(editor, prevPath)

              if (
                isListItemBlock(prev) &&
                Editor.string(editor, prevPath).trim() === ""
              ) {
                event.preventDefault()
                convertListItemToParagraph(editor, prevPath)
                Transforms.select(editor, Editor.start(editor, listPath))
                return
              }

              if (!isListItemBlock(prev)) {
                event.preventDefault()
                Transforms.insertNodes(editor, newParagraphBlock(), {
                  at: [rootIdx],
                })
                Transforms.select(editor, Editor.start(editor, [rootIdx]))
                return
              }
            }
          }
        }
      }

      if (event.key === "Enter" && codeLineMatch) {
        event.preventDefault()
        const [codeLine, codeLinePath] = codeLineMatch
        const codeLineNode = codeLine

        const lineText = codeLineNode.children
          .map((c) => ("text" in c ? c.text : ""))
          .join("")

        const leadingWhitespace = lineText.match(/^\s*/)?.[0] ?? ""

        const codeBlockPath = codeLinePath.slice(0, -1)
        const [codeBlockNode] = Editor.node(editor, codeBlockPath)
        // TODO: Use Zod for this when we migrate the types to Zod
        const codeBlock = codeBlockNode as SlateBlock

        const lineIdx = codeLinePath[codeLinePath.length - 1]
        const codeBlockIndex = codeBlockPath[0]
        if (lineIdx === undefined || codeBlockIndex === undefined) {
          return
        }

        const isLastLine = lineIdx === codeBlock.children.length - 1
        const isEmpty = lineText.trim() === ""

        // Inviolability: don't let an empty trailing Enter "split out" of a
        // demo source code-block (which would create a paragraph between the
        // demo and any following demo source tab and break the cluster). The
        // user can still add lines inside the block normally.
        const isDemoSourceBlock =
          isCodeBlock(codeBlock) && codeBlock.demoId !== undefined

        if (isEmpty && isLastLine && !isDemoSourceBlock) {
          Transforms.removeNodes(editor, { at: codeLinePath })
          Transforms.insertNodes(
            editor,
            {
              type: "paragraph",
              id: `b${Date.now()}`,
              children: [{ text: "" }],
            } as SlateBlock, // TODO: Zod
            { at: [codeBlockIndex + 1] }
          )
          Transforms.select(editor, [codeBlockIndex + 1, 0])
        } else if (isEmpty && isLastLine && isDemoSourceBlock) {
          // No-op: stay on the last empty line of a demo source block. Don't
          // insert another empty line, don't exit the block.
          return
        } else {
          const anchor = editor.selection?.anchor
          if (!anchor) return

          // TODO: Zod
          const emptyLine = {
            type: "code-line",
            language: codeLineNode.language,
            children: [{ text: "" }],
          } as SlateBlock

          if (Editor.isStart(editor, anchor, codeLinePath)) {
            Transforms.insertNodes(editor, emptyLine, { at: codeLinePath })
            const shiftedLinePath = [...codeLinePath.slice(0, -1), lineIdx + 1]
            Transforms.select(editor, {
              path: [...shiftedLinePath, 0],
              offset: 0,
            })
          } else if (Editor.isEnd(editor, anchor, codeLinePath)) {
            const newLinePath = [...codeLinePath.slice(0, -1), lineIdx + 1]
            Transforms.insertNodes(editor, emptyLine, { at: newLinePath })
            Transforms.select(editor, {
              path: [...newLinePath, 0],
              offset: 0,
            })
          } else {
            Transforms.splitNodes(editor, { at: anchor })
            const newLinePath = [...codeLinePath.slice(0, -1), lineIdx + 1]
            const [newLineNode] = Editor.node(editor, newLinePath)
            // TODO: Parse with Zod, also is this a new node type? Or a ParagraphBlock?
            const newLine = newLineNode as SlateBlock
            const newLineText = newLine.children
              .map((c) => ("text" in c ? c.text : ""))
              .join("")

            if (!newLineText.startsWith(leadingWhitespace)) {
              Transforms.insertText(editor, leadingWhitespace, {
                at: {
                  path: [...newLinePath, 0],
                  offset: 0,
                },
              })
            }
          }
        }
        return
      }

      if (event.key === "Tab" && codeLineMatch) {
        event.preventDefault()

        if (editor.selection && Range.isCollapsed(editor.selection)) {
          const offset = editor.selection.anchor.offset
          const spacesToInsert = 2 - (offset % 2)
          editor.insertText(" ".repeat(spacesToInsert))
        } else {
          if (!editor.selection) {
            throw new Error("No selection?")
          }
          const [start, end] = Editor.edges(editor, editor.selection)
          const startCodeLinePath = Editor.above(editor, {
            at: start,
            match: isLineOfCodeElement,
          })?.[1]
          const endCodeLinePath = Editor.above(editor, {
            at: end,
            match: isLineOfCodeElement,
          })?.[1]

          if (startCodeLinePath && endCodeLinePath) {
            const startLineIndex =
              startCodeLinePath[startCodeLinePath.length - 1]
            const endLineIndex = endCodeLinePath[endCodeLinePath.length - 1]
            if (startLineIndex === undefined || endLineIndex === undefined) {
              return
            }

            for (let i = startLineIndex; i <= endLineIndex; i++) {
              const linePath = [...startCodeLinePath.slice(0, -1), i]
              const [lineNode] = Editor.node(editor, linePath)
              // TODO: Zod
              const line = lineNode as SlateBlock
              const lineText = line.children
                .map((c) => ("text" in c ? c.text : ""))
                .join("")

              if (event.shiftKey) {
                const match = lineText.match(/^( {1,2})/)
                const spacesChunk = match?.[1]
                if (spacesChunk !== undefined) {
                  const spacesToRemove = spacesChunk.length
                  Transforms.delete(editor, {
                    at: {
                      anchor: { path: [...linePath, 0], offset: 0 },
                      focus: {
                        path: [...linePath, 0],
                        offset: spacesToRemove,
                      },
                    },
                  })
                }
              } else {
                Transforms.insertText(editor, "  ", {
                  at: { path: [...linePath, 0], offset: 0 },
                })
              }
            }
          }
        }
        return
      }

      if (
        event.key === "Tab" &&
        (!editor.selection || Range.isCollapsed(editor.selection))
      ) {
        // TODO: Shift+tab when range is collapsed and in the leading whitespace of a line of code should dedent.
        // TODO: Selecting a line and pressing tab shouldn't indent the line below
        event.preventDefault()
        const [match] = Editor.nodes(editor, {
          match: isListItemBlock,
        })
        if (match) {
          const [node, path] = match
          const currentDepth = node.depth ?? 0
          const newDepth = event.shiftKey
            ? Math.max(0, currentDepth - 1)
            : Math.min(6, currentDepth + 1)
          Transforms.setNodes(
            editor,
            { depth: newDepth } as Partial<SlateBlock>,
            { at: path }
          )
        }
      }
    },
    [editor, visibility]
  )

  return (
    <Slate
      editor={editor}
      initialValue={value}
      onSelectionChange={(selection) => {
        if (selection && !Range.isCollapsed(selection)) {
          setGhostSelection(selection)
        }
      }}
      onChange={(descendants) => {
        // Descendant is a union of Element and Text, but Slate will never put
        // text nodes at the root level, so this cast is safe:
        setValue(descendants as SlateBlock[])
      }}
    >
      <div className={styles.editorContainer}>
        <EditorToolbarArea>
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            decorate={decorate}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={onKeyDown}
            placeholder="Start writing..."
            className={styles.editor}
          />
        </EditorToolbarArea>
      </div>
    </Slate>
  )
}

type DocElementProps = Pick<
  RenderElementProps,
  "attributes" | "children" | "element"
> & {
  frozenElements: Record<string, React.ReactNode>
}

const DocElement = ({
  attributes,
  children,
  element,
  frozenElements,
}: DocElementProps) => {
  const node = element
  const editor = useSlate()

  switch (node.type) {
    case "heading": {
      const level = node.level ?? 1
      if (level === 1) return <h1 {...attributes}>{children}</h1>
      if (level === 2) return <h2 {...attributes}>{children}</h2>
      return <h3 {...attributes}>{children}</h3>
    }
    case "code-block":
      return (
        <CodeBlockElement attributes={attributes} element={node}>
          {children}
        </CodeBlockElement>
      )
    case "code-line":
      return (
        <CodeLineElement attributes={attributes} element={node}>
          {children}
        </CodeLineElement>
      )
    // TODO: Selecting multiple list items and pressing tab/shift+tab should change depth
    case "list-item": {
      const marginLeft = 20 + (node.depth ?? 0) * 24
      const path = ReactEditor.findPath(editor, node)
      const { isFirstInRun, isLastInRun } = getListItemRunEdgeFlags(
        editor,
        path,
        node
      )
      return (
        <div
          {...attributes}
          className={styles.listItem({
            listType: node.listType,
            first: isFirstInRun,
            last: isLastInRun,
          })}
          style={{ marginLeft }}
        >
          {children}
        </div>
      )
    }
    case "link":
      return (
        <LinkElement attributes={attributes} linkElement={node}>
          {children}
        </LinkElement>
      )
    case "frozen":
      return (
        <FrozenBlockElement
          attributes={attributes}
          element={node}
          frozenElements={frozenElements}
        >
          {children}
        </FrozenBlockElement>
      )
    case "paragraph":
    default: {
      const hasFrozen = node.children.some(isFrozenBlock)
      if (hasFrozen) {
        const { className: slateClass, ...rest } =
          attributes as typeof attributes & {
            className?: string
          }
        return (
          <div
            {...rest}
            className={[slateClass, styles.paragraphWithFrozen]
              .filter(Boolean)
              .join(" ")}
          >
            {children}
          </div>
        )
      }
      return <p {...attributes}>{children}</p>
    }
  }
}

type FrozenBlockElementProps = Pick<
  RenderElementProps,
  "attributes" | "children" | "element"
> & {
  frozenElements: Record<string, React.ReactNode>
}

const FrozenBlockElement: React.FC<FrozenBlockElementProps> = ({
  attributes,
  children,
  element,
  frozenElements,
}) => {
  const isSelected = useSelected()
  const isFocused = useFocused()
  const selected = isSelected && isFocused
  const frozenBlock = element as Extract<SlateBlock, { type: "frozen" }>
  const frozenContent = frozenBlock.id ? frozenElements[frozenBlock.id] : null

  // Derive tab names from the Slate document: find all code-block siblings
  // that belong to this frozen block via demoId, in document order.
  const editor = useSlate()
  const tabNames = editor.children
    .filter(
      (n): n is Extract<SlateBlock, { type: "code-block" }> =>
        isCodeBlock(n) && n.demoId === frozenBlock.id
    )
    .map((n) => n.tab ?? "")
    .filter(Boolean)

  return (
    <div
      {...attributes}
      data-description="frozen block"
      className={styles.frozenBlock({
        selected,
        fullWidth: frozenBlock.fullWidth !== false,
      })}
    >
      <div contentEditable={false} style={{ userSelect: "none" }}>
        {frozenContent}
      </div>
      {frozenBlock.id && tabNames.length > 0 && (
        <div contentEditable={false} style={{ userSelect: "none" }}>
          <DemoTabs demoId={frozenBlock.id} tabNames={tabNames} />
        </div>
      )}
      {children}
    </div>
  )
}

type DemoTabsProps = {
  demoId: string
  tabNames: string[]
}

/**
 * Source-tab row rendered by FrozenBlockElement, outside the Demo component.
 *
 * The tabs are an editor concern: they toggle the visibility of Slate
 * code-block siblings (linked by demoId), not anything inside the Demo render
 * itself. By living here, they are positioned via frozenBlock's existing
 * position:relative — no CSS grid tricks needed in the Demo.
 */
const DemoTabs: React.FC<DemoTabsProps> = ({ demoId, tabNames }) => {
  const visibility = useDemoSourceVisibility()
  const activeTab = visibility.visibleTabFor(demoId)

  return (
    <div className={styles.demoTabs} data-description="demo tabs">
      {tabNames.map((name) => {
        const active = activeTab === name
        return (
          <button
            key={name}
            type="button"
            className={styles.demoTab({ active })}
            onClick={() => {
              if (active) {
                visibility.hide(demoId)
              } else {
                visibility.show(demoId, name)
              }
            }}
          >
            {name}
          </button>
        )
      })}
    </div>
  )
}

type CodeBlockElementProps = Pick<
  RenderElementProps,
  "attributes" | "children"
> & {
  element: Extract<SlateBlock, { type: "code-block" }>
}

/**
 * Renders a Slate code-block. For "demo source" code-blocks (those with a
 * demoId), reads visibility from DemoSourceVisibilityContext: when hidden,
 * still renders {children} (Slate needs the DOM nodes for selection mapping)
 * but with display:none so the user can't see or interact with them. Arrow-
 * key navigation has matching logic to skip past hidden code-blocks.
 */
const CodeBlockElement: React.FC<CodeBlockElementProps> = ({
  attributes,
  element,
  children,
}) => {
  const visibility = useDemoSourceVisibility()
  const demoId: string | undefined = element.demoId
  const tab: string | undefined = element.tab
  const isHidden =
    demoId !== undefined &&
    tab !== undefined &&
    !visibility.isVisible(demoId, tab)

  if (isHidden) {
    return (
      <pre
        {...attributes}
        // Keep the DOM nodes (children) attached for Slate selection mapping,
        // but hide visually and from interaction. Arrow-key handlers in
        // onKeyDown skip past these blocks so cursor never lands here.
        style={{ display: "none" }}
        data-description="hidden demo source"
        data-demo-id={demoId}
        data-tab={tab}
      >
        {children}
      </pre>
    )
  }

  return (
    <pre
      {...attributes}
      className={styles.codeBlock({ demo: Boolean(demoId) })}
    >
      {children}
    </pre>
  )
}

type CodeLineElementProps = RenderElementProps & {
  element: SlateBlock
  children: React.ReactNode
}

const CodeLineElement: React.FC<CodeLineElementProps> = ({
  attributes,
  element,
  children,
}) => {
  const editor = useSlate()
  const path = ReactEditor.findPath(editor, element)
  const lineIndex = path[path.length - 1] ?? 0

  return (
    <div {...attributes} className={styles.codeLine}>
      <span className={styles.lineNumber} contentEditable={false}>
        {lineIndex + 1}
      </span>
      {children}
    </div>
  )
}

type LinkElementProps = Pick<RenderElementProps, "attributes"> & {
  linkElement: SlateBlock & { type: "link" }
  children: React.ReactNode
}

const LinkElement: React.FC<LinkElementProps> = ({
  attributes: { ref: slateRef, ...attributes },
  linkElement,
  children,
}) => {
  return (
    <a
      {...attributes}
      href={linkElement.url}
      className={styles.link}
      ref={slateRef as React.Ref<HTMLAnchorElement>}
    >
      {children}
    </a>
  )
}
