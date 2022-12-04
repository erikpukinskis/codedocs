[<img alt="screenshot" src="/screenshot.png" width="800" style="margin-bottom: -3em;"/>](https://codedocs.ambic.app/)

**Codedocs** is a Storybook replacement that's designed for the professional application developer. It presumes you've already set up a React application build pipeline, that you're happy with it, and you just want to document your components.

If you're a beginner, you can still use Codedocs, but you may want to start with a scaffold like [Confgen](https://github.com/ambic-js/confgen). Confgen can generate a React app for you with Codedocs preconfigured.

### Table of contents

- [Codedocs vs Storybook](#codedocs-vs-storybook)
- [How it works](#how-it-works)
- [What it doesn't do](#what-it-doesnt-do)
- [Context Providers](#context-providers)
- [Customizing](#customizing)
- [Example](#example)
- [Future](#future)
- [Inspiration](#inspiration)

### Codedocs vs Storybook

Design choices in Codedocs have been made to address some places where Storybook missed. Each of these issues has influenced Codedocs design:

|     | Storybook                                                                                                               | Codedocs                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | Storybook error handling is atrocious. Stories just silently won't load                                                 | Codedocs uses your existing build pipeline                                                                         |
| 2   | MDX files don't have type checking, and TSX files can't do proper prose documentation.                                  | Everything is in TSX files, fully typed. And you just drop your demos and API references into your prose JSX block |
| 3   | Storybook has its own special build environment that's different from your app's. It adds a whole layer of debugging.   | It uses your existing build pipeline                                                                               |
| 4   | The default Storybook layout is not very good for a public demonstration site.                                          | It's designed as public documentation site first                                                                   |
| 5   | Your documentation uses Storybook's design system, not YOUR design system that you worked so hard to create.            | The UI is 100% swappable for your own                                                                              |
| 6   | It's slow to start up and hot reloading is unreliable.                                                                  | Startup time is as fast as you can make your build pipeline go                                                     |
| 6   | Adding types to your stories is... optional. Each new story is a new chance for someone to decide not to type anything. | Everything is in TSX files, fully typed                                                                            |

### How it works

Your documentation files can still live alongside your code, but they just export JSX elements:

```js
// Button.docs.tsx
import React from "react"
import { Doc, Demo } from "codedocs"
import { Button } from "./Button"

export default (
  <Doc path="/Controls/Button">
    The Button is meant to be used for everything that can be tapped, whether or
    not it has a background.
  </Doc>
)

export const BasicButton = (
  <Demo>
    <Button>Save</Button>
  </Demo>
)
```

Then, you can go ahead and use create-react-app or install Vite and throw an index.html somewhere,
that's up to you. To get the site working, all you need to do is render `<DocsApp>` in there:

```js
import * as ButtonDocs from "./Button.docs"
import { DocsApp } from "codedocs"
import React from "react"
import { render } from "react-dom"

render(<DocsApp docs={[ButtonDocs]} />, document.getElementById("root"))
```

I can't instruct you on how to start that, because you can set up the build however you want. That's
the point, you can just use the same build infrastructure you've surely already set up to build your
Design System.

### What it doesn't do

- **Doesn't** work with anything other than React and React Router. If you are using Svelte or Ember you're out of luck.
- **Doesn't** provide interactive "knobs". Demos are just code samples. If you want to change the demo, you change the code.
- **Doesn't** magically scan through your source tree and "analyze" it. Magic is great when it works, until it doesn't. Your Codedocs are _just a normal React component_. You build it right alongside your components, within the same build system.
- **Doesn't** set up the devevelopment or deploy scripts for you. You are a
- professional application developer. You've
  probably already set up lots of infrastructure for deploying apps using your Design System. You
  can keep doing that. The `codedocs` package provides some React components that make it easy to turn
  documentation files into site.
- **Doesn't** look good by default. You provide all the components that are used to render the site. That's the
  point: document your Design System _in_ your Design System.

The other thing is doesn't do is _have any dependencies_. You provide React and React Router as
peerDependencies, and that's it.

### Context Providers

If you're maintaining a design system, or just a component library, you likely have:

- global styles
- a theme object
- other React contexts

That are required by your components. You can provide a provider that sets those up:

```js
import { Global, ThemeProvider } from '@emotion/react'
import React from 'react'
import reset from 'emotion-reset';

<DocsApp
  docs={...}
  DesignSystemProvider={({ children }) => (
    <ThemeProvider theme={...}>
      <Global styles={reset} />
      <Global styles={`
        body {
          font-family: 'sans-serif'
        }
        ...
      `} />
      {children}
    </ThemeProvider>
  )}
  ...
/>
```

### Customizing

If you want to render the Codedocs UI yourself, within your own Design System, you may override any or all of its components. You can copy/paste the originals in [/lib/components](/lib/Components) to get started and make sure you're following the same API:

```js
<DocsApp
  docs={...}
  Columns={({ children }) => ...}
  LeftColumn={({ children }) => ...}
  MainColumn={({ children }) => ...}
  NavList={({ children }) => ...}
  NavHeading={({ children }) => ...}
  NavItem={({ children }) => ...}
  NavLink={({ children, to }) => ...}
  PageHeading={({ children }) => ...}
  DemoHeading={({ children }) => ...}
/>
```

### Example

For an example, check out Codedocs own docs in [/docs](/docs). You can see these running at https://codedocs.ambic.app.

### Future

The general philosophy of Codedocs is

1. It's OK to manually maintain docs, not everything has to be magic
2. This is really about explanation not "documentation"
3. Work within the existing build
4. Give the best possible realtime feedback

Things that will probably happen:

- [x] Search
- [ ] When Site Sections can't be shown, include them in the left nav
- [ ] Add a 2nd breakpoint where we can have the menu trigger and the search bar
- [ ] Code samples
- [ ] "Live" code samples
- [ ] Server-side rendering
- [ ] Move the demos into the `<Doc>` block so you can lay out those pages explicitly
- [ ] An `<API>` helper component for documenting component apis
- [ ] Babel macro which can grab the code sample for your demos
- [ ] A contact sheet so you can visually scan for the control you're looking for

Things that _might_ happen:

- Visual tests
- In-browser unit tests
- Editing mode

### Inspiration

- https://wattenberger.com/blog/react-and-d3
- https://stitches.dev/docs/variants
- https://eslint.org/docs/latest/user-guide/configuring/configuration-files
- https://www.apollographql.com/docs/react/
- https://evergreen.segment.com/components/table
- https://docs.drone.io/runner/kubernetes/configuration/resources/
