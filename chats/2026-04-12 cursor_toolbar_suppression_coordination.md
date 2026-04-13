# Toolbar suppression coordination
_Exported on 4/12/2026 at 11:19:04 PDT from Cursor (3.0.16)_

---

**User**

@lib/Editor/Editor.tsx:499-503 I would like to suppress this toolbar if the formatting toolbar here @lib/Editor/Editor.tsx:321-322  is open.

What are the cleanest ways I could do that? Certainly I could set up a context provider to coordinate. I suspect there will be other toolbars too over time. Like a different one for images. And maybe some context menus that also suppress both the formatting toolbar and the link toolbar.

---

**Cursor**


(Depth 2) Reviewing how both toolbars determine visibility so we can suggest clean coordination patterns.




Checking how `renderElement` is defined and whether `ghostSelection` is in scope for `LinkElement`.




(Depth 2)

Here is what the code is doing today and some clean ways to coordinate it.

## What you have now

Both the formatting bar and the link chrome use the **same** toolbar id and the **same** outlet:

- `SelectionFormattingToolbar` renders `Toolbar` with `id="inline-editor-tools"` and a `DOMRect` target when there is an active range and a usable client rect.

```82:83:lib/Editor/SelectionFormattingToolbar.tsx
  return (
    <Toolbar id="inline-editor-tools" target={targetRect} open>
```

- `LinkElement` renders another `Toolbar` with the same id, anchored to the link element.

```499:503:lib/Editor/Editor.tsx
        <Toolbar
          id="inline-editor-tools"
          target={element}
          open={hasFocus || isHovered || isEditing}
        >
```

So both port into `toolbar-outlet-inline-editor-tools`. That is a second reason to coordinate them: even aside from UX, two portaled roots in one outlet is easy to get wrong (stacking, focus, which one “wins”).

---

## 1. **Derived flag in `DocEditor` + small context (usually the cleanest for your case)**

The formatting toolbar’s “is it showing?” logic is **pure** in terms of data you can already reach from `DocEditor`: same `editor` ref, `ghostSelection`, and you already track focus with `isFocused` on `Editable`. `SelectionFormattingToolbar` duplicates that with `useSlate` / `useSlateSelection` / `ReactEditor.isFocused`, but the underlying inputs are the same.

So you can:

1. Extract the shared predicate (the `activeRange` choice, `suppressesFormattingToolbar`, `toDOMRange` / rect checks) into something like `getFormattingToolbarTargetRect(editor, { ghostSelection, isFocused })`.
2. Compute `formattingToolbarOpen` once in `DocEditor` (or in a thin child **inside** `Slate` if you want to stay identical to Slate’s selection subscription—see note below).
3. Provide `formattingToolbarOpen` (or a broader object) via context.
4. In `LinkElement`, set `open={(hasFocus || isHovered || isEditing) && !formattingToolbarOpen}` (and optionally force `isEditing` to close when formatting opens, if you want stricter behavior).

**Why this beats “child sets context in `useEffect`”:** no sync lag or double-render fights; one source of truth.

**Slate subscription nuance:** if you ever see the parent lagging Slate’s selection by a frame, move the **derivation** into a component that sits under `<Slate>` and passes the boolean up via context setter in render (not effect)—still a single derived value, still no effect-based sync.

---

## 2. **Named “UI layers” / overlay stack (scales to images + context menus)**

If you expect many competing surfaces, model **who is allowed to show chrome** instead of pairwise flags:

- Examples of layers: `formatting`, `link`, `image`, `contextMenu`.
- Each surface, when “open”, **registers** a layer (or pushes onto a stack with priority).
- Policy examples:
  - **Suppress link + formatting** when `contextMenu` is active.
  - **Suppress link** when `formatting` is active.
  - **Image** toolbar might suppress link hover chrome but not formatting—or the opposite; you encode that in one place.

Implementation shapes:

- **Context + reducer** (`{ active: Set<Layer> }` or ordered list) with small helpers: `claimLayer('formatting')`, `releaseLayer`, used from components that know when they’re visible.
- **Tiny external store** (Zustand/Jotai) if you want to avoid rerender plumbing or touch layers from non-React code.

Avoid **effect-only** registration when you can tie it to render: `open && <Layer id="formatting" />` where `Layer` registers in render and unregisters on unmount—keeps registration aligned with visibility.

---

## 3. **Separate outlets + z-index (orthogonal, still need rules)**

Split ids, e.g. `inline-formatting` vs `inline-link`, so each toolbar has its own outlet and positioning story. You **still** need a rule for “only one at a time” (or explicit stacking), so this complements (1) or (2); it does not replace coordination.

---

## Practical recommendation

- **Near term:** shared derived `formattingToolbarOpen` (or shared `targetRect` + boolean) from the same logic `SelectionFormattingToolbar` uses, exposed on context; narrow `LinkElement`’s `open` with that. That is minimal surface area and matches your immediate ask.
- **As more surfaces appear:** grow that context into a **small layer registry + policy** (one module that answers `shouldShowLinkChrome(state)` / `shouldShowFormattingToolbar(state)`) so you do not accumulate N×(N−1) boolean combinations.

If you want, in Agent mode we could sketch the extracted helper signature to match `SelectionFormattingToolbar` exactly so behavior stays identical.

---

**User**

Another option I'm considering:

Just render the toolbars in a central place. Probably SelectionFormattingToolbar just becomes UnifiedToolbar or whatever. And it would observe all of: what Slate element the pointer is over, what slate element the text cursor is on, what the first span of the selection is, etc. And makes a unified determination of where the toolbar should be positioned and what should be inside it.

---

**Cursor**


(Depth 2)

A single **unified chrome** component is a legitimate design. It matches how many editors treat “floating UI”: one coordinator, one anchor, one suppression policy. Here is how it tends to play out in a Slate app like yours.

## What works well

- **One outlet, one portal** — You avoid two `Toolbar` instances fighting over `inline-editor-tools` and make z-index/focus simpler.
- **Explicit priority** — “Expanded selection → formatting; else if pointer over link → link chrome; else if image selected → …” lives in one place instead of N components each guessing whether someone else is visible.
- **Consistent positioning** — You choose one rule for anchor (selection rect, element rect, pointer-adjacent) per mode instead of mixing `DOMRect` from a range with `getBoundingClientRect()` on an `<a>`.

## What gets harder (and how people contain it)

**1. Inputs are heterogeneous**  
Today the link bar gets hover/focus from `useElementObserver` on the actual `<a>`. A unified bar must reproduce that with either:

- DOM hit-testing at pointer (or `document.elementFromPoint`) mapped back to Slate (`ReactEditor.toSlateNode` / range APIs), or  
- capturing `onMouseMove` / `onMouseEnter` on rendered elements and lifting “hovered path” into editor-scoped state (still centralized, but you need a path from render props to shared state).

That is all doable; it is just **more wiring** than “toolbar lives next to the element.”

**2. Risk of a god component**  
The fix is usually **not** one 800-line `UnifiedToolbar`, but one **orchestrator** that delegates:

- `useToolbarMode(editor, pointerState, selectionState) → { kind, anchor, payload }`  
- Small presentational panels: `<FormattingPanel />`, `<LinkPanel />`, …

So the *decision* is central; the *UI* stays modular.

**3. Render churn**  
If every mousemove runs full Slate walks, it can get expensive. Typical mitigations: throttle pointer updates, short-circuit when mode cannot change, memoize by stable keys (path + mode).

**4. Slate vs DOM source of truth**  
Formatting is naturally selection-based; link hover is naturally DOM-based. A unified model should document which **canonical signals** you trust (e.g. “anchor position always from DOM rects for link mode, from `toDOMRange` for selection mode”) so you do not get flicker when they disagree for a frame.

## Compared to context / layers

- **Unified orchestrator**: best when you want **one visible chrome** and **one positioning pipeline**; good long-term if you add image tables, etc.  
- **Layers + separate components**: best when surfaces are **independent** and you want colocation (link code owns link UI) with a thin global “who wins” policy.

Those can **merge**: unified *policy* (who wins) with *panels* colocated in separate files, or unified *container* that imports link/formatting content from feature modules.

## Practical takeaway

Your idea is **clean at the product level** (one toolbar, clear precedence). The implementation cost is mostly **pointer → Slate → mode** plumbing and keeping the orchestrator thin via a small state machine or discriminated union (`{ type: 'formatting', range } | { type: 'link', path } | { type: 'none' }`).

If you go this route, I would explicitly **split toolbar id/outlets** (or one outlet only) so legacy per-element `Toolbar` usage does not creep back in alongside the unified one.

---

**User**

One reason I'm leaning towards the unified approach is I worry we may eventually have a LOT of element observers if a document gets long, and that feels like it doesn't scale as well as DOM hit-testing. Which I assume is a pattern that has pretty well established algorithms. What do you think?

> 3. Render churn
> If every mousemove runs full Slate walks, it can get expensive

We definitely won't render on mousemove. We'd set up an out-of-band listener that only updated React state when the hovered element changes.

> Formatting is naturally selection-based; link hover is naturally DOM-based. 

Doesn't Slate kind of solve this though? It has a pretty robust DOM-to-Slate tracking engine right?

---

**Cursor**


Checking what `useElementObserver` does so we can compare costs fairly.




(Depth 2)

## Per-element observers vs hit-testing

In your codebase, `useElementObserver` is not a generic “observer pattern” abstraction; **each mounted instance** does this:

- **`ResizeObserver`** on that element (for layout/size-driven updates)
- **`pointerenter` / `pointerleave` / `focus` / `blur`** on that element

So for *N* links you get **N `ResizeObserver`s and N sets of pointer/focus listeners**. Browsers batch resize work, but **subscription count still grows with document size**, and you pay the observers even when the user is nowhere near those links.

A unified model can avoid almost all of that for hover discovery:

- **One** container-level pointer path (capture `pointermove` / `pointerover` on the editor surface, or document-level if you need it), then `document.elementFromPoint` (or the event target with care for hit targets).
- **React updates only when the resolved Slate “hover target” changes** — as you said — so you are not re-rendering on every mouse event; you still *run* a cheap comparison each time the pointer moves, which is normal.

For **positioning**, you can also shift from “every link always observed for size” to “**measure the active anchor only**” when the toolbar is actually in link mode: `ReactEditor.toDOMNode` (or range → DOM) + `getBoundingClientRect()`, plus **one** window `scroll`/`resize` listener to re-measure or close. That is usually what makes the unified approach feel more scalable than **N × ResizeObserver**.

So your scaling intuition is reasonable: **hit-testing + measure-on-demand** often scales better in the “huge doc, sparse interaction” case than **per-node observers on every link**.

Caveats (not blockers, just design detail):

- You must decide what “the hovered thing” is when the pointer is between lines, on padding, on `contentEditable=false` chrome, etc. (stable `null` vs last target.)
- `elementFromPoint` can be tricky with **overlays** (your own toolbar, portals); you may need to ignore pointer events on floating UI or temporarily hide hit targets.

---

## Does Slate “solve” selection vs hover?

**It solves the mapping, not the policy.**

Slate React keeps DOM nodes tied to the model (`ReactEditor.toSlateNode`, `toDOMNode`, ranges, etc.), so once you have a **DOM node under the pointer**, you can usually walk to a Slate node and path without maintaining your own parallel index. That **unifies the bridge** between “pointer is over the page” and “which Slate subtree,” in the same spirit as selection.

What Slate does **not** automatically give you is:

- **Which semantic mode wins** (expanded selection formatting vs collapsed-in-link vs image hit-box).
- **Which DOM node is authoritative** when decorations / split leaves produce **extra** DOM (you still pick the right element to call `toSlateNode` on — often `closest` to a known Slate root attribute).
- **Perfect agreement** for a frame when DOM and selection are both moving; you still write the precedence rules.

So: **yes**, you can treat pointer and selection as two inputs into **one** resolver that outputs a discriminated union, and use Slate’s APIs as the shared implementation for both. The remaining work is **your** state machine, not reinventing DOM↔model mapping from scratch.

---

**Bottom line:** Avoiding **N per-link `ResizeObserver`s** is a solid reason to lean unified (or at least to stop hanging full `useElementObserver` on every inline). Pairing **central hit-testing** with **Slate’s DOM/node helpers** is a standard combination; your “only set state when hover identity changes” plan is the right way to keep pointer handling cheap.

---

**User**

> elementFromPoint can be tricky with overlays (your own toolbar, portals); you may need to ignore pointer events on floating UI or temporarily hide hit targets.

I only care about detecting elements inside the slate document, which my overlays won't be.

I think we're ready to go ahead and plan this refactor. Please draft the plan.

---

**Cursor**


Exploring the editor and toolbar setup so we can draft an accurate refactor plan.




Checking how Slate maps DOM nodes and whether `Editable` forwards pointer handlers:




Confirming: `useElementObserver` attaches a ResizeObserver and four listeners per link — removing it from each `LinkElement` addresses the scaling concern. Drafting the plan.



---

**User**

> Link editing (isEditing + draft URL) is lifted here so the toolbar stays open while the pointer moves; use a session object like { path: Path, draftUrl: string } | null, cleared on Save/Cancel or if that path is no longer a link

Explain what you mean by this? I wonder if we need a more explicit coordination API for this kind of thing where, i.e. Link

---

**Cursor**


(Depth 1)

Here is what that sentence was trying to capture, in plain terms.

## What changes when the toolbar moves out of `LinkElement`

Today the link UI **lives next to the link**: `isEditing` and the draft `href` are React state on `LinkElement`, and the toolbar stays open because `open={… || isEditing}` still sees `isEditing === true` even if the pointer is no longer over the `<a>`.

After unification, “which link we’re showing chrome for” comes from **global** signals: selection, pointer hit-test, etc. If you only had `hoveredLinkPath`, then as soon as the user moves the mouse off the link (or `elementFromPoint` hits something that isn’t that link), you’d lose the target and the edit UI would disappear or jump to another link.

So you need a **second concept** besides “where is the pointer?”:

- **Hover / hit-test**: “Pointer suggests we care about link at path `P`.”
- **Edit session**: “User explicitly opened edit mode for link at path `P`; keep showing that UI and that draft URL until they Save, Cancel, or the node at `P` stops being a link.”

A small object like `{ path, draftUrl } | null` is just one way to represent that second concept: `null` means “not editing a link”; non-null means “editing is pinned to this path with this draft string.” While that’s set, the resolver prefers **edit session** over **hover** for deciding what to render, so moving the mouse doesn’t tear down the form.

“Cleared on Save/Cancel” is obvious. “If that path is no longer a link” covers unwrap/delete/undo so you don’t keep a stale session pointing at a path that now refers to a paragraph or nothing.

---

## Do you need a more explicit coordination API?

You don’t *have* to call it a “session object”—that was implementation shorthand. More explicit patterns people use:

1. **Discriminated union on the orchestrator** — e.g. `chrome: { kind: 'idle' } | { kind: 'linkHover', path } | { kind: 'linkEdit', path, draftUrl }` so it’s obvious in one type which rules apply.

2. **Layer / claim API** — e.g. `claimChrome({ owner: 'link', path, mode: 'edit' })` / `releaseChrome()`, with the unified bar only showing whoever holds the claim. Hover would *not* take the claim; Edit would.

3. **Small context** — `LinkChromeController` with `startEdit(path)`, `endEdit()`, consumed only by the unified toolbar (not necessarily by `LinkElement`).

The important idea is the same: **something must “pin” edit mode to a path** so it isn’t purely derived from transient pointer position. Whether that’s `{ path, draftUrl }`, `linkEdit: { path, draft }`, or a `claimChrome` call is mostly how explicit you want the API to read.

Your message cut off at “i.e. Link”—if you meant “should `LinkElement` own starting/stopping edit via an explicit API,” that can work too: the link wouldn’t render the toolbar, but it could still call `startLinkEdit(path)` on pointer-down / button click from a child (or you keep all buttons in the toolbar and never need that). If you finish the thought, we can narrow to one pattern.

---

**User**




I'm a little lost in the verbiage here. I think we're in agreement about positioning. The only issue is how LinkToolbarContent signals to the UnifiedToolbar "hey, we're editing so keep us open even if the cursor moves or whatever".

Can you explain your plan for that in really simple terms?

---

**Cursor**


(Depth 1)

**Simple version**

The **UnifiedToolbar** is one React component. It already decides “show link stuff” vs “show formatting” vs “hide.” You add **one extra piece of local state** there, something you can think of as:

**`linkEditMode: off | on`**

(and when it’s `on`, you also remember **which link** and **what’s in the URL field**—that’s just normal controlled input state in the same place.)

- **Before:** “Show link toolbar” = pointer is over a link (or link has focus), *unless* we’re in formatting mode.
- **After you click Edit:** UnifiedToolbar sets **`linkEditMode = on`**.  
  While that’s on, **you don’t hide the link toolbar just because the pointer moved away.** You only turn it **off** when the user hits Save, Cancel, or the link goes away.

So **LinkToolbarContent** doesn’t need a fancy protocol. It’s either:

- **Buttons inside the same component** that call `setLinkEditMode(true)` when you press Edit, or  
- A tiny child that receives **`onStartEditing`** from the parent—that’s just the parent passing a function that sets that state.

There’s no separate service or context required for “keep us open”; it’s **the parent remembering “user is editing a link”** so it doesn’t treat “mouse left the link” as “close the bar.”

---

**User**

OK so maybe if I have a shared ToolbarContentProps type it might have some signals like:

type ToolbarContentProps = {
  requestOpen: () => void
  releaseOpen: () => void
}

And then our LinkToolbarContent component would use those to signal to the UnifiedToolbar that it wants to stay open?

---

**Cursor**


(Depth 1)

Yes. That is the same idea as “parent remembers we’re editing,” just with an **explicit callback contract** so `LinkToolbarContent` does not need to know *how* the parent implements it.

A few small tweaks so the API stays clear:

**Naming** — `requestOpen` / `releaseOpen` can sound like “show the toolbar for the first time.” What you really mean is closer to **“keep this chrome pinned even if hover/selection would normally drop it.”** Names like `holdChrome` / `releaseChrome`, or `pinOpen` / `unpinOpen`, often read better than `requestOpen` / `releaseOpen`.

**When to call**

- Call **hold** when the user enters edit mode (e.g. clicks Edit).
- Call **release** on Save, Cancel, and ideally in a **`useEffect` cleanup** so if the panel unmounts while still “holding,” you do not leave the parent stuck pinned.

**Who owns the rest** — The parent still decides positioning, priority vs formatting, and the actual `Toolbar` `open` prop. The callbacks only adjust the **“don’t auto-dismiss because pointer moved”** part of that logic.

So: shared `ToolbarContentProps` with hold/release (or your names) is a reasonable, extensible shape for `LinkToolbarContent`, `ImageToolbarContent`, etc., as long as the names match the behavior you want.

---

**User**

OK, I like pinOpen / unpinOpen. Please update the plan accordingly.

---

**Cursor**


Locating and updating the plan file to use `pinOpen` / `unpinOpen` and the shared content props pattern.




Updating the plan file to document `pinOpen` / `unpinOpen` and the shared `ToolbarContentProps` pattern.




Updated [unified_inline_editor_toolbar_e65278c7.plan.md](/Users/erikpukinskis/.cursor/plans/unified_inline_editor_toolbar_e65278c7.plan.md) to match **`pinOpen` / `unpinOpen`** and the shared content props idea. Summary of edits:

1. **Overview** — Mentions lifted draft state plus the explicit pin/unpin contract instead of “session object” wording.

2. **Todo `lift-link-edit`** — Describes `ToolbarContentProps`, `LinkToolbarContent` calling `pinOpen` on Edit, `unpinOpen` on Save/Cancel and in effect cleanup.

3. **Mermaid diagram** — `editSession` node renamed to **`pinned`** with label “Pinned open via pinOpen from content.”

4. **Link mode bullet** — Describes lifted draft + path in `UnifiedInlineToolbar`, and that staying open while the pointer moves is handled by **`pinOpen` / `unpinOpen`**, cleared on Save/Cancel, cleanup, or invalid path.

5. **New subsection `ToolbarContentProps`** — Documents something like  
   `type ToolbarContentProps = { pinOpen: () => void; unpinOpen: () => void }`, parent-owned pinned state, and **`LinkToolbarContent`** responsibilities (including **`useEffect` cleanup** for `unpinOpen`).

6. **Pointer leave** — “Unless pinned” instead of “unless link edit session.”

7. **`LinkElement` bullet** — Points at passing `pinOpen` / `unpinOpen` into the link panel instead of vague “callbacks or context.”

8. **Verification** — “While pinned” instead of “while editing.”

---

**User**

Awesome! One more request: Can we also open the link toolbar when the text cursor is inside a link range? That way it can be opened with the keyboard.

---

**Cursor**


Updating the plan to include showing the link toolbar when the caret is inside a link (keyboard-accessible), preserving formatting priority for expanded selections.




Updating the plan: add caret-in-link as a link-toolbar signal, clarify precedence when caret and pointer disagree, and extend the diagram and todos.




Updated [unified_inline_editor_toolbar_e65278c7.plan.md](/Users/erikpukinskis/.cursor/plans/unified_inline_editor_toolbar_e65278c7.plan.md) with **caret-in-link** behavior. Summary:

**Behavior**
- With **formatting inactive**, the link toolbar can show when the **caret is collapsed inside a link** (`Editor.above` + `isLinkElement` at `selection.anchor`), with the editor **focused**, so keyboard navigation into a link can open the same chrome as hover.
- **Expanded selection** still prefers the **formatting** toolbar (unchanged).
- If **hover** and **caret** imply different links while focused, **caret wins** so the keyboard position is authoritative; with no focus, behavior stays pointer-driven (plus existing ghost/formatting rules).

**Diagram**
- Inputs now feed **`hoverLink`** and **`caretLink`**, merged into **`activeLink`** before priority.

**Pointer leave**
- Clarified that leaving the editor clears the **hover-derived** path only; **caret-in-link** can still keep the link toolbar visible.

**Todos**
- **`pointer-hover`** todo now includes deriving the caret link path from Slate when the selection is collapsed and focused.

**Verification**
- Added a manual check for **keyboard caret inside link** opening the link toolbar.

