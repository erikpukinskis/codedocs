Codedocs is a Storybook replacement that fixes a few things:

1. Storybook error handling is atrocious. Stories just silently won't load. It's annoying.
2. MDX files don't have type checking, and TSX files can't do proper prose documentation. It's annoying.
3. Storybook has its own special build environment that's different from your app's. Why can't you use the same build pipeline that builds your components to build your Storybook?
4. The default Storybook layout is not very good for a public documentation site.
5. Your documentation uses Storybook's design system, not YOUR design system. It's annoying.
6. It's slow to start up and hot reloading is unreliable.
7. Typing your stories is... optional. By default nothing enforces you setting them upcorrectly. And there's a lot of `any` in the types. It's annoying.

**Code Docs** was designed to fix these limitations.

Say goodbye to fiddling with your Storybook config until it kind of works like your app. Build your
documentation _on the same infrastructure as your app_.

### What it doesn't do

- **Doesn't** work with anything other than React and React Router. If you are using Svelte or Ember you're out of luck. But feel
  free to copy the model and build something similar in your framework! And let's share code if you
  do!
- **Doesn't** provide interactive "knobs". Demos are just code samples.
- **Doesn't** magically scan through your source tree and "analyze" it. Magic is great when it works, but
  Code Docs are _just normal React_. If you want another page on your documentation site, you import it and pass it to
  `<DocsApp>` manually.
- **Doesn't** set up dev or deploy scripts for you. You are a professional application developer. You've
  probably already set up lots of infrastructure for deploying apps using your Design System. You
  can keep doing that. The `codedocs` package provides some React components that make it easy to turn
  documentation files into site.
- **Doesn't** look good by default. You provide all the components that are used to render the site. That's the
  point: document your Design System _in_ your Design System.

The other thing is doesn't do is _have any dependencies_. You provide React and React Router as
peerDependencies, and that's it.

### How it works

Your documentation files can still live alongside your code, but they just export JSX elements:

```js
// Button.docs.tsx
import React from "react"
import { Doc, Demo } from "codedocs"
import { Button } from "./Button"

export default (
  <Doc path="Controls/Button">
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

### ~Customizing~ _Creating_ the look

I know you have global styles, and a theme, and maybe some other React.Contexts that keep your
Design System working. You can provide a provider that sets those up:

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

And you can also override any component that `<DocsApp>` uses:

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

An example is provided in [app/](https://github.com/ambic-js/codedocs/tree/main/app)

![screenshot of the example docs site with a button demo](https://raw.githubusercontent.com/erikpukinskis/ambic-js/codedocs/main/example/screenshot.png)

### Future

The general philosophy of Code Docs is

1. It's OK to manually maintain docs, not everything has to be magic
2. This is really about explanation not "documentation"
3. Work within the existing build
4. Give the best possible realtime feedback

Along those lines, I'll list things that definitely won't happen:

- Introspecting your props
- In-browser editing of docs

Things that will probably happen:

- Move the demos into the `<Doc>` block so you can lay out those pages explicitly
- An `<API>` helper component for documenting component apis
- Babel macro which can grab the code sample for your demos
- Search
- A contact sheet so you can visually scan for the control you're looking for

Things that _might_ happen:

- Visual tests
- In-browser unit tests
- "Live" code samples
