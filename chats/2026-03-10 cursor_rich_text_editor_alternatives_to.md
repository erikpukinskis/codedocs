# Rich text editor alternatives to Draft.js

_Exported on 4/1/2026 at 16:40:09 PDT from Cursor (2.6.22)_

---

**User**

I'm looking for a spiritual successor to the draft.js rich text editor. What I love about Draft.js:

1. It is a true React library, built around immutable state.
2. It has a very clean block-based architecture, rather than an HTML-based one. HTML gets way too messy. I like the Draft.js has its own rock solid representation of the document, just an array of blocks, and each block has an array of characters, and that's it.

I don't like

1. that it is "headful" I would prefer if it was headless, but in practice it works OK.
2. I don't like that you can't have overlapping entities. Ideally you can have a bold word inside a hyperlink. But in draft.js I don't think you can do that.

What would you recommend? It seems like the closest thing to what I want is TipTap, but I tried pasting a bullet list into TipTap, and the whole list is a single block? I would expect each bullet to be a block.

I'm tempted to just stick with draft.js even though it's no longer maintained!!

---

**Cursor**

This is a great question and I think you're right to be thoughtful about it. Let me share my thoughts on the landscape.

## Slate.js is probably your best match

Based on your specific preferences, **Slate.js** seems like the closest spiritual successor to Draft.js, even more so than TipTap:

1. **True React library with immutable state** — Slate is React-first. Its state is immutable (it uses Immer under the hood). You work with plain JSON objects representing the document, and apply transforms that produce new state. Very similar philosophy to Draft.js.

2. **Clean block-based architecture** — Slate's document model is a tree of nodes, but you control the schema. You can keep it flat (just an array of block nodes, each containing text leaves) which is very close to Draft.js's model. There's no HTML under the hood — it's all plain JSON.

3. **Headless** — Slate is explicitly headless/renderless. You provide your own React components for rendering each node and leaf. This is a direct upgrade over Draft.js in the dimension you care about.

4. **Overlapping marks** — Slate natively supports overlapping marks. Bold inside a link works perfectly. Marks are applied to text leaves independently, so they compose freely.

5. **List items as individual blocks** — In Slate, you define your own schema. Each list item can be its own top-level block node, exactly like Draft.js's `unordered-list-item` block type. This is the flat model you prefer.

## Why TipTap didn't feel right

Your instinct about TipTap is correct. TipTap is built on ProseMirror, which uses a **nested** document model. A bullet list is:

```
bulletList (single node)
  └─ listItem
       └─ paragraph "Item 1"
  └─ listItem
       └─ paragraph "Item 2"
```

The whole list is a parent node containing child list items. This is architecturally different from Draft.js's flat `[block, block, block]` model. ProseMirror's nesting is powerful for some use cases, but if you loved Draft.js's flat block array, it's going to feel foreign and overly complex.

TipTap _does_ support overlapping marks and is headless, so it checks those boxes. But the document model is the heart of a rich text editor, and it sounds like the flat model is what resonates with you.

## What about Lexical?

**Lexical** is Meta's official successor to Draft.js, built by the same team. It's worth considering, but it departs from Draft.js's philosophy in some ways:

- It's framework-agnostic (not React-first), with React bindings available
- It uses a mutable state model with its own update loop, not immutable snapshots
- It has its own node tree rather than plain JSON
- It's actively maintained and performant

But it doesn't have the same "immutable JSON blocks" purity that made Draft.js elegant. It's more of a "what if we built Draft.js with performance as the top priority" rather than "what if we built Draft.js with the same philosophy but better."

## My recommendation

If what you loved about Draft.js was the conceptual clarity — immutable state, flat array of blocks, each block is just text with annotations — then **Slate.js** is your answer. It takes that same philosophy and fixes the pain points (headless, overlapping marks, extensible schema).

The main caveat: Slate has had a long and sometimes bumpy development history (many breaking API changes over the years). But the current API (0.x, despite the version number) has been stable for a while and is well-documented. You might also look at **Plate** (built on Slate) if you want more batteries-included components, though it adds some opinions on top.

I wouldn't blame you for sticking with Draft.js if it's working — but if you do migrate, Slate is the natural next step.

---

**User**

When I try to paste some rich text into the Slate demo at https://www.slatejs.org/examples/richtext it does a terrible job of formatting it. I'm pasting the rich text, but the markdown of it is:

**Daycare during Block 2:**

- Before drop-off, call ahead and tell them the child is potty training commando (no underwear under pants) — most daycares will work with this
  [Hocuspocus](https://github.com/ueberdosis/hocuspocus)

- Share the child's specific cues so staff know what to watch for

- Ask how often they take kids to the potty, where the bathroom is, and what they do for accidents — the vibe of their answer matters more than the exact policy

- Pack 3-4 changes of pants, and a wet bag for soiled clothes

- Before walking in on Day 1, tell the child: "When you need to go potty, tap [teacher's name] on the arm" and "Whatever you're playing with will still be there when you get back"

- Daycare will handle it differently than home — that's okay, kids adapt

Slate loses the bold, the bullets, the link, and also adds a bunch of whitespace. Why do I get just this:

Daycare during Block 2:

Before drop-off, call ahead and tell them the child is potty training commando (no underwear under pants) — most daycares will work with this
Hocuspocus

Share the child’s specific cues so staff know what to watch for

Ask how often they take kids to the potty, where the bathroom is, and what they do for accidents — the vibe of their answer matters more than the exact policy

Pack 3-4 changes of pants, and a wet bag for soiled clothes

Before walking in on Day 1, tell the child: “When you need to go potty, tap [teacher’s name] on the arm” and “Whatever you’re playing with will still be there when you get back”

Daycare will handle it differently than home — that’s okay, kids adapt

---

**Cursor**

This is actually a significant red flag about Slate, and it's worth understanding what's happening and what it implies.

## What's going wrong

Slate does **not** ship with a robust HTML paste handler. When you paste rich text, the clipboard contains HTML (from whatever source you copied from). Slate needs to:

1. Read that HTML
2. Deserialize it into Slate nodes (paragraphs, bullets, bold marks, links)
3. Insert those nodes

The demo at slatejs.org doesn't implement step 2 properly. It likely just strips the HTML and inserts plain text — which is why you lose bold, bullets, and the link. The extra whitespace comes from block-level HTML elements (`<p>`, `<ul>`, `<li>`) getting collapsed into text but with their surrounding newlines partially preserved.

Slate provides a separate [`paste-html` example](https://www.slatejs.org/examples/paste-html) that shows how you'd implement this yourself, using `slate-hyperscript`. But you have to build and maintain that deserializer yourself — mapping `<strong>` → bold mark, `<ul><li>` → list-item block, `<a>` → link inline, etc.

## What this reveals about Slate

Paste handling is one of the hardest parts of a rich text editor, and Slate basically hands it back to you unsolved. You'd be writing and maintaining your own HTML-to-Slate deserializer. This is not a small task — the edge cases (nested lists, tables, Gmail's HTML, Google Docs' HTML, Notion's HTML) are endless.

In contrast, **ProseMirror** (and therefore TipTap) has a first-class `DOMParser` that is genuinely sophisticated. It handles pasting from Google Docs, Notion, email clients, etc., quite well out of the box. This is one of the areas where the ProseMirror architecture really shines — HTML is ProseMirror's native representation, so parsing it back in is a solved problem.

## Reconsidering the tradeoffs

Given your criteria again:

|                   | Draft.js | Slate             | TipTap/ProseMirror |
| ----------------- | -------- | ----------------- | ------------------ |
| React-first       | ✅       | ✅                | ⚠️ (React adapter) |
| Flat block model  | ✅       | ✅ (configurable) | ❌ (nested)        |
| Headless          | ❌       | ✅                | ✅                 |
| Overlapping marks | ❌       | ✅                | ✅                 |
| Paste HTML        | ⚠️       | ❌ (DIY)          | ✅                 |

Slate's paste problem is genuinely serious for a real app. If users ever paste from Google Docs, Notion, email, a website, or even another browser tab, you'll be chasing edge cases forever.

## Honest assessment

If paste quality matters to you, **TipTap/ProseMirror's paste handling is meaningfully better** and that gap is hard to close with Slate. The nested list model is annoying but it's a document model concern — users don't see it, and you can work with it.

If you're building something where paste is rare or controlled (e.g. users mostly type, rarely paste), Slate's model is more elegant and you could live with DIY paste handling using a library like **`@udecode/plate`** (which is Slate with batteries included, including a much better paste handler).

**Plate** is probably the most realistic "spiritual successor to Draft.js that actually works in production" answer. It's Slate under the hood but with all the hard parts (paste, serialization, plugins) already built out.

---

**User**

Are there any standalone libraries that are focused on converting HTML to something markdown-like (and therefore compatible with Slate?)

Is there a body of work focused on this "handling pasted rich text" problem?

---

**Cursor**

Yes, there's a real body of work here, and it's more mature than I implied.

## The unified.js ecosystem

The most principled answer is **[unified](https://unifiedjs.com/)**, which is an entire ecosystem built around AST transformations between content formats. The key pieces:

- **rehype** — parses HTML into an AST (called hast)
- **remark** — parses/serializes Markdown into an AST (called mdast)
- **rehype-remark** — converts hast → mdast
- **remark-slate** (community) — converts mdast → Slate nodes

This gives you a pipeline: clipboard HTML → hast → mdast → Slate nodes. Each step is well-tested independently. The unified ecosystem is widely used (billions of npm downloads), actively maintained, and handles a huge range of edge cases because it's used in production by many large projects (MDX, Gatsby, Next.js docs, etc.).

## Turndown

**[Turndown](https://github.com/mixmark-io/turndown)** (formerly `to-markdown`) is the most popular standalone HTML-to-Markdown library. It's focused, well-maintained, and highly extensible via plugins (there's even a `turndown-plugin-gfm` for GitHub Flavored Markdown — tables, task lists, strikethrough). If you don't need the full unified pipeline and just want "give me Markdown from this HTML blob," Turndown is the go-to.

## The paste problem specifically

There's actually a well-studied complexity to clipboard paste that goes beyond HTML parsing:

1. **The clipboard contains multiple simultaneous formats.** When you copy from Notion, the clipboard has `text/html`, `text/plain`, and sometimes a proprietary format like `application/x-vnd.google-docs-document-slice-clip+wrapped`. A good editor picks the richest format available.

2. **Different apps produce wildly different HTML.** Google Docs wraps everything in `<b style="font-weight:normal">` (yes, really). Gmail uses `<div>` instead of `<p>`. Word produces XML-flavored HTML nightmares. This is why ProseMirror's DOMParser has years of quirk-handling baked in.

3. **Turndown/unified handle clean HTML well** but may struggle with the messy HTML that real apps produce.

## What @udecode/plate actually does

Plate (the batteries-included Slate framework) has a `@udecode/plate-serializer-html` package that takes the direct HTML → Slate nodes approach, with a rule-based system for mapping HTML elements to Slate node types. It handles the "which clipboard format to prefer" problem too. It's probably the most production-tested solution in the Slate ecosystem specifically.

## Bottom line

If you're building on Slate and want to handle paste well, the realistic options in order of pragmatism:

1. **Use Plate** — paste handling is included and battle-tested
2. **Use unified (rehype → remark → Slate)** — principled, composable, but you wire it together yourself
3. **Use Turndown** — simpler, but you still need a Markdown → Slate step after

The unified ecosystem is the closest thing to a "standard body of work" for this problem, and it's worth knowing about regardless of which editor you choose.

---

**User**

Is there a route where I wire up ProseMirror just to handle pasting mime-types, and then take the resulting HTML into something like unified?

---

**Cursor**

This is a clever idea, and it's more viable than it might seem — because `prosemirror-model` is actually usable **standalone**, without spinning up a full ProseMirror editor view.

## The standalone DOMParser approach

ProseMirror's paste intelligence lives primarily in `prosemirror-model`'s `DOMParser`. You can use it without an editor:

```javascript
import { Schema, DOMParser, DOMSerializer } from "prosemirror-model"
import { schema as basicSchema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"

const schema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, "paragraph block*", "block"),
  marks: basicSchema.spec.marks,
})

function normalizeHTML(dirtyHtml) {
  // Parse messy HTML into a ProseMirror doc (schema-normalized)
  const parser = DOMParser.fromSchema(schema)
  const dom = new window.DOMParser().parseFromString(dirtyHtml, "text/html")
  const doc = parser.parse(dom.body)

  // Serialize back to clean, predictable HTML
  const serializer = DOMSerializer.fromSchema(schema)
  const fragment = serializer.serializeFragment(doc.content)
  // ...convert fragment to string, feed into unified
}
```

The output is **schema-normalized HTML** — no `<b style="font-weight:normal">` Google Docs nonsense, no weird nested spans, just clean `<strong>`, `<ul><li>`, `<a href>` etc. Then unified's rehype parser has a much easier job.

## Or skip unified: use `prosemirror-markdown`

There's actually an official ProseMirror package — **[prosemirror-markdown](https://github.com/prosemirror/prosemirror-markdown)** — that serializes a ProseMirror doc to Markdown. So the full pipeline stays within the ProseMirror ecosystem:

```
clipboard HTML
  → prosemirror-model DOMParser (normalizes quirky HTML)
  → ProseMirror doc
  → prosemirror-markdown serializer
  → clean Markdown
  → your Slate deserializer
```

No unified needed. And since `prosemirror-markdown` is written by Marijn Haverbeke (ProseMirror's author), the round-trip fidelity is good.

## Is this actually worth doing?

Honest tradeoffs:

**For:** You'd get ProseMirror's years of clipboard quirk-handling (Google Docs, Notion, email clients) as a black box, without adopting ProseMirror as your editor. It's genuinely the best HTML normalizer available.

**Against:** You're adding `prosemirror-model`, `prosemirror-schema-basic`, `prosemirror-schema-list`, and optionally `prosemirror-markdown` as dependencies — that's ~100KB just to normalize paste input. And you need a DOM environment (browser or jsdom), which you probably have in a browser editor anyway.

**The real question** is whether unified's rehype parser handles messy real-world HTML (Google Docs, Notion) well enough on its own. I honestly don't know how well-tested rehype is against those specific sources. ProseMirror's parser has definitely been battle-tested against them.

## A practical middle ground

You could also just handle the MIME type selection yourself (reading `text/html` vs `text/plain` from the clipboard) and feed the raw HTML straight into unified, then see how bad the real-world failures are before reaching for ProseMirror as a normalizer. The approach you're describing would be an optimization you add later if needed — not something you'd necessarily need from day one.

---

**User**

Great point. I'll start with Slate, add Unified when I get to copy/pasting, and then add ProseMirror if I need to.

Say more about Slate's flat block model... you said above that it's configurable?

---

**Cursor**

Yes — Slate's document model is one of its best features, and the configurability is real.

## Slate's node types

Slate has exactly three kinds of nodes:

1. **Element** — has a `type` string and a `children` array
2. **Text** — has a `text` string, plus any mark properties (`bold`, `italic`, etc.)
3. **Editor** — the root, which is itself an Element

That's it. The entire document is just a tree of these.

## How you get a flat model

There's nothing in Slate that forces nesting. You can structure your editor state exactly like Draft.js's block array:

```json
[
  { "type": "paragraph", "children": [{ "text": "Intro paragraph" }] },
  { "type": "heading-one", "children": [{ "text": "A Title" }] },
  { "type": "list-item", "children": [{ "text": "Item 1" }] },
  { "type": "list-item", "children": [{ "text": "Item 2" }] },
  { "type": "paragraph", "children": [{ "text": "More text" }] }
]
```

`list-item` is just a block type, not a node nested inside a `bulletList` container. Consecutive `list-item` blocks imply a list visually, just like in Draft.js. This is 100% valid Slate.

## Marks compose freely

Where Slate is strictly better than Draft.js is marks. Text nodes carry marks as plain properties:

```json
{ "text": "bold link text", "bold": true }
```

A link is an **inline element** wrapping text children:

```json
{
  "type": "link",
  "url": "https://example.com",
  "children": [{ "text": "bold link text", "bold": true }]
}
```

Bold inside a link. Works perfectly. No overlapping entity problem.

## The tradeoff of the flat model

The one place the flat model gets awkward — same as Draft.js — is **nested lists** (indented sub-bullets). With a flat model, you handle this with a `depth` or `indent` property on each list-item block:

```json
{ "type": "list-item", "indent": 0, "children": [{ "text": "Item 1" }] },
{ "type": "list-item", "indent": 1, "children": [{ "text": "Sub-item" }] }
```

This works but requires you to write the indent/outdent logic yourself, computing depth from surrounding siblings. Draft.js had the same `depth` field and the same awkwardness. If you never need nested lists, you never hit this.

## Void nodes

Slate also has **void elements** — nodes Slate treats as atomic (no editable text inside). Images, embeds, horizontal rules. Equivalent to Draft.js's `atomic` block type:

```json
{ "type": "image", "url": "https://...", "children": [{ "text": "" }] }
```

(The empty text child is required by Slate's data model even though it's not editable.)

## Bottom line

Slate's model is genuinely more expressive than Draft.js's while being optional — you only use nesting where it helps you. For a basic editor (paragraphs, headings, flat lists, bold/italic/links), the state looks almost identical to Draft.js's `ContentState`, but with cleaner mark composition and a schema you define yourself.

---

**User**

@docs/Doc.docs.tsx:7-52 Now the real twist.

I would like ideally to set up bidirectional editing between a Slate-ified version of this Doc, and the underlying JSX file.

So, when you view this file in the browser, you can edit it using slate, and then export the resulting document back to JSX.

I do realize there will be limitations here, the slate editing will be very limited, to just a flat list of markdown-like blocks. Whereas JSX has literally no limits...

... But I am fine if certain blocks are just "frozen" if they're not editable.

And for the Codedocs-specific elements (like this <Demo> element on line 36) Codedocs has its own editor for those which can be embedded. No need for Slate to do anything.

My thought is that maybe in the macro (@macro/index.js:47-48) we can take the JSX representation of the <Doc> and... maybe Unified helps here? Convert that to Slate in an analogous way to what we described for the HTML pasting?

Do you think that could work? Any major holes in this plan?

---

**Cursor**

This is a genuinely exciting architecture. Let me think through it carefully.

## Where Unified fits (and doesn't)

You actually might not need Unified for the JSX → Slate direction. Your macro already has the **Babel AST** — that's a richer, more precise representation than HTML. Going JSX AST → hast → mdast → Slate adds two intermediate formats for no real benefit. A direct JSX AST → Slate node mapping would be more natural:

```
<p>         → { type: "paragraph", children: [...] }
<h2>        → { type: "heading", level: 2, children: [...] }
<ul><li>    → { type: "list-item", children: [...] }
<a href=""> → { type: "link", url: "...", children: [...] }
<strong>    → bold mark on text leaves
<code>      → code mark on text leaves
<Demo>      → { type: "frozen", children: [{ text: "" }] }  // void element
```

The macro can do this at build time and embed the Slate document as JSON in the bundle.

## The hard part: Slate → JSX (writing back)

This is where the real complexity lives, and it has a few specific challenges:

**1. Frozen block round-tripping.** When you hit a `<Demo>`, `<Code>`, or any unrecognized component, you need to preserve its exact original source. The Babel AST has `start`/`end` character positions. You could store the raw source string for each frozen block in the Slate void node's data. When serializing back, splice it in verbatim. This is doable.

**2. JSX whitespace is terrible.** Look at your own code — you have `{" "}` in several places. JSX whitespace rules are unintuitive, and generating readable JSX means getting these right. This is solvable but annoying. You'd essentially build a small JSX printer for your supported element subset.

**3. The write path needs a dev server.** The macro runs at build time, but edits happen in the browser. So you need:

- A dev server endpoint that accepts POST with the new Slate document
- A serializer (running in Node) that converts Slate → JSX source
- File writing back to the `.docs.tsx` file

This is similar to how Storybook's "controls" or live-editing tools work.

## Architecture sketch

```
BUILD TIME (macro):
  .docs.tsx source
    → Babel AST
    → walk JSX children of <Doc>
    → emit Slate document JSON + frozen block source strings
    → embed in component bundle

BROWSER (runtime):
  Slate editor renders the document
  Frozen blocks render as read-only void elements
  <Demo> blocks render their own Codedocs editor
  User edits paragraph/heading/list text

SAVE (dev server):
  Browser POSTs Slate document JSON
  Server serializes editable blocks → JSX
  Server splices frozen blocks back by position
  Server writes .docs.tsx
  HMR picks up the change → browser refreshes
```

## Major holes

**The biggest risk is the round-trip.** If you open a file, make zero edits, and save — the output should be identical to the input (or at least semantically equivalent). JSX formatting is opinionated enough that you'll probably want to run Prettier on the output. But Prettier + your serializer need to produce stable output that doesn't churn on every save.

**Interleaved frozen/editable content** is tricky. What if someone writes:

```tsx
<p>Some text</p>
<Demo><Button /></Demo>
<p>More text</p>
```

You need the frozen `<Demo>` to stay between those two paragraphs, and its exact source must survive editing of the paragraphs around it. Storing frozen blocks as Slate void nodes with their original source strings handles this, as long as you're careful about the serialization order.

**What about inline custom components?** If someone writes `<p>Click the <Tooltip>button</Tooltip> to proceed</p>`, the `<Tooltip>` is inline inside an editable paragraph. Do you freeze the whole paragraph? Freeze just the Tooltip span? This is a design decision you'll need to make — I'd suggest freezing the entire paragraph if it contains any non-standard inline elements, at least initially.

## Is this plan sound?

Yes. The core idea — Babel AST → Slate at build time, Slate → JSX on save — is architecturally clean. The key insight that makes it work is that your editable subset is **small and well-defined** (paragraphs, headings, lists, links, bold/italic/code). You're not trying to round-trip arbitrary JSX through Slate. Everything outside that subset is frozen and passes through as opaque source strings.

The riskiest piece to prototype first would be the **Slate → JSX serializer + frozen block splicing**. If that round-trips cleanly, the rest is straightforward.

---

**User**

> Do you freeze the whole paragraph?
> Ya, freeze the whole block (paragraph).

Only blocks that are fully comprehended by our parser would be editable. Everything else can just be frozen.

I'm assuming documents will mostly be one or the other: created in the editor, or created as code. I want them to be compatible and integrated but it's totally fine if the "code-writers" are writing docs that aren't editable by the "editor users".

One thing I'm curious about: How would the "frozen" elements be rendered? They need to have access to, e.g. things in the file scope, external libraries, etc. They need to really run as constructed, we can't just "grab the source".

The "block-compatible elements" on the other hand need to be converted into Slate.

And then Slate needs to be able to embed the former amonst the latter...

How would that work?

---

**Cursor**

Good question — this is the crux of the architecture. Let me look at the macro first to ground the answer.

Now I understand the macro's structure well. Here's the answer to the rendering question, which resolves into a clean architecture.

## How frozen blocks get rendered

The macro is the key. Instead of converting children to a runtime data structure, it **transforms them at compile time** into two distinct props on `<Doc>`:

- `slateDocument` — a plain JSON array (serializable), contains editable blocks as Slate nodes and frozen blocks as Slate void nodes (just `{ type: "frozen", id: "f0", children: [{ text: "" }] }`)
- `frozenElements` — a plain JS object mapping IDs to **actual compiled React elements** (`{ "f0": <Demo><Button /></Demo> }`)

So this:

```tsx
<Doc path="/Docs/Doc">
  <p>Some text</p>
  <Demo>
    <Button />
  </Demo>
  <p>More text</p>
</Doc>
```

Becomes this at compile time:

```tsx
<Doc
  path="/Docs/Doc"
  slateDocument={[
    { type: "paragraph", id: "b0", children: [{ text: "Some text" }] },
    { type: "frozen", id: "f0", children: [{ text: "" }] },
    { type: "paragraph", id: "b1", children: [{ text: "More text" }] },
  ]}
  frozenElements={{
    "f0": (
      <Demo>
        <Button />
      </Demo>
    ),
  }}
/>
```

The `<Demo><Button /></Demo>` in `frozenElements` is a real compiled React element — Babel has already processed it, all imports are resolved, TypeScript has checked it. It runs exactly as constructed. No source string tricks needed for rendering.

Inside the `Doc` component, Slate's `renderElement` callback handles the interleaving:

```tsx
const renderElement = ({ element, attributes, children }) => {
  if (element.type === "frozen") {
    return (
      <div {...attributes} contentEditable={false}>
        {frozenElements[element.id]}
        {children} {/* Slate requires this even on void nodes */}
      </div>
    )
  }
  // ... paragraph, heading, list-item, etc.
}
```

Frozen blocks are read-only void nodes — Slate skips them during editing, but they render fully.

## For write-back (saving edits)

Rendering doesn't need source strings, but writing back does. The macro also stores **character positions** of each frozen block (from the Babel AST's `node.start`/`node.end`) in a separate `frozenPositions` prop. The dev server reads the original `.docs.tsx` file, uses those positions to extract each frozen block's source verbatim, and splices editable blocks back in as freshly-serialized JSX.

Now I have a complete picture. Let me create the plan.

---

**User**

This is looking very promising! Couple questions:

1. How would we deal with converting the nested JSX structure into flat blocks? I think lists are the only place where that would be an issue.

2. Can Slate handle "shift+enter" type deal where it just adds a line break to an existing block, rather than creating a new block? And then "enter" creates a new block?

3. Don't worry about the whole dev server endpoint thing. For now let's just have a button that shows the JSX inside a <Code> element. We can have three tabs at the top of the document: "Static" is just the plain rendered {children}, "Edit" shows the Slate editor, and "Source" shows the TSX.

Curious to hear your answers. And see any updates you want to make to the plan.

---

**Cursor**

Great questions. Let me answer all three, then update the plan.

**1. Lists — nested JSX to flat blocks**

Lists are the only nesting issue, and they're straightforward to flatten. The macro walks a `<ul>` or `<ol>`, emits one Slate node per `<li>`, and stores the list type on each node:

```json
{ "type": "list-item", "listType": "ul", "children": [{ "text": "Item 1" }] },
{ "type": "list-item", "listType": "ul", "children": [{ "text": "Item 2" }] }
```

The `<ul>/<ol>` wrapper becomes implicit — just consecutive `list-item` nodes with the same `listType`. The serializer (Slate→JSX) re-groups them by type when writing back.

The one exception: any `<li>` that contains a nested `<ul>` or `<ol>` (deep nested lists) would be frozen, since we can't flatten it. That's probably fine — deeply nested lists are rare in docs content.

**2. Shift+Enter for soft line break**

Yes, Slate handles this cleanly. You override `onKeyDown`:

```tsx
onKeyDown={(event) => {
  if (event.key === "Enter" && event.shiftKey) {
    event.preventDefault()
    editor.insertText("\n") // soft break, stays in same block
    // regular Enter falls through to Slate's default split-block behavior
  }
}}
```

Standard pattern, no plugin needed.

**3. Tabs instead of dev server — big simplification**

This is a much cleaner first step. The macro emits a `frozenSources` prop (string versions of frozen blocks, only for the Source tab display — production build can strip this). No file writing, no server endpoint needed at all.

Now let me update the plan to reflect all of this.

Plan updated. The key changes from your feedback:

- **Dev server removed entirely** — no file writing, no Vite middleware, no `frozenPositions`
- **Three tabs** (Static / Edit / Source) replace the save button
- **`frozenSources`** replaces `frozenPositions` — the macro stores the raw source string of each frozen block (for the Source tab display), rather than character offsets that require reading the file at runtime
- **List flattening** is now explicitly documented in the macro section, with the nested-list-as-frozen fallback
- **Shift+Enter** soft break is in the Edit tab spec

The Source tab is particularly nice as a first step — it gives users a "copy to file" escape hatch without needing any server infrastructure, and validates that the round-trip serializer works correctly before you ever wire up file writing.

---

**User**

Great!

> That's probably fine — deeply nested lists are rare in docs content.

I would like to support deeply nested lists.

---

**Cursor**

Good call. Deeply nested lists are actually not that hard with the flat+depth model Draft.js used. Let me update the plan.

Done. The approach is the same one Draft.js used — a `depth` field on each flat list-item node. Three things change relative to the flat-only version:

**Macro:** Recursively walks `<li>` children. When a `<li>` contains both text and a nested `<ul>/<ol>`, it emits the text node at the current depth and recurses into the sub-list at `depth + 1`. No frozen fallback needed.

**Serializer (Slate → JSX):** Uses a depth-stack algorithm. When processing list-items in sequence, it opens a new `<ul>/<ol>` (nested inside the prior `<li>`) when depth increases, and closes them when depth decreases. This reconstructs proper HTML list nesting from the flat representation.

**Edit tab:** `Tab` / `Shift+Tab` on a list-item node increments/decrements `depth`, which is the standard keyboard interaction for nested lists everywhere.
