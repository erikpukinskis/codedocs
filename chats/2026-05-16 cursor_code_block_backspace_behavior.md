# Code block backspace behavior
_Exported on 5/16/2026 at 13:00:44 PDT from Cursor (3.2.16)_

---

**User**

@lib/Editor/DocEditor.test.tsx:98-100 When you're in a code block and you press backspace, it should turn the block into a paragraph, the same way it does when you are in a list item.

---

**Cursor**

(Depth 2) Let me read the relevant files to understand the current behavior.

Let me find the backspace/list item handling logic in the editor.

Now let me find the `convertListItemToParagraph` function and understand the code block structure.

Now let me look at the types file and the test to understand the full picture.

Let me look at the `select` method and the `DocEditorHandle` type in `DocEditor.tsx`.

Now I have a clear picture. The test is pressing `{delete}` (forward delete) for the second key, but the user wants backspace behavior. Let me implement `convertCodeBlockToParagraph` and add the backspace handler, then update the test to use `{backspace}`.

The structure to handle:
- `[0]` code-block → `[0]` paragraph
- The code-block's first `code-line` text becomes the paragraph's text leaf
- Remaining `code-line`s (if any) become a new code-block after the paragraph

Now I'll add the `convertCodeBlockToParagraph` function right after `convertListItemToParagraph`, then add the `onKeyDown` handler:

Now add the handler in `onKeyDown` after the list-item backspace check:

Now update the test to use `{backspace}` instead of `{delete}` for the second keypress:

Now let me check for linter errors in the edited file:

`LineOfCodeElement` isn't imported as a type. Let me fix all the issues:

Now fix the remaining lint issues in the function — non-null assertion and the unsafe `structuredClone` return:

Let me check if errors 1 and 2 are pre-existing, and fix error 3:

Both remaining errors are pre-existing (line 780 type error and the unused `Point` import existed before my changes). Let me run the test to verify it passes:

That error is in `serialization.ts` referencing `~/Editor/types` — looks pre-existing. Let me check if the test was passing before my changes by looking at what `~/Editor/types` resolves to:

Pre-existing failure. Let me restore my changes and find the right test invocation:

All tests pass. Here's a summary of what was implemented:

**`convertCodeBlockToParagraph`** — a new function (analogous to `convertListItemToParagraph`) that:
- Reads the first `code-line`'s text content
- Removes the `code-block` and inserts a `paragraph` with that text
- If there were multiple lines, the remaining lines are kept as a new `code-block` immediately after

**`onKeyDown` handler** — added a check in the `Backspace` branch: when the cursor is at the very start of a non-demoId `code-block`, `event.preventDefault()` is called and `convertCodeBlockToParagraph` runs — exactly the same pattern as the list-item case.

**Test** — updated the second keypress from `{delete}` (forward delete) to `{backspace}`, matching what the user described.

