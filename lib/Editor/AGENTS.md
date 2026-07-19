## Block hierarchy

Root blocks are `paragraph`, `heading`, `list-item`, `frozen`, and `code-block`.

Unlike other block types, `code-block` is a container whose children are `code-line` elements (not text nodes directly). Paragraphs, headings, and list-items contain text/link nodes directly.

## Demo cluster

A `frozen` block paired with one or more `code-block` siblings sharing a `demoId`. Demo-source code-blocks are hidden by default.

Structural operations on them (type conversion, split, merge, delete) are forbidden; text edits within them are fine. Guard structural operations with `block.demoId === undefined`.

## Editor Tests

Try not to use Slate APIs directly in tests. Ideally use the UI to interact with the editor. If absolutely necessary, wrap Slate APIs in the imperative handle set by `DocEditor`.

