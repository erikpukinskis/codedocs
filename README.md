[<img alt="screenshot" src="docs/screenshot.png" width="800" style="margin-bottom: -3em;"/>](https://codedocs.ambic.app/)

**Codedocs** are the best way to document your React component library.

## Table of contents

- [Features](#features)
- [How it works](#how-it-works)
- [What it doesn't do](#what-it-doesnt-do)
- [Context Providers](#context-providers)
- [Example](#example)
- [Future](#future)
- [Inspiration](#inspiration)

## Quick Start

See a running example at [www.usecodedocs.com](https://www.usecodedocs.com/).

To get started in your own project, create your first documentation file:

```tsx
// Button.docs.tsx
import React from "react"
import { Doc, Demo } from "codedocs/macro"
import { Button } from "./Button"

export const ButtonDocs = (
  <Doc path="/Controls/Button">
    <p>
      The Button is meant to be used for everything that can be tapped, whether
      or not it has a background.
    </p>
    <h2>Basic Button</h2>
    <Demo>
      <Button>Save</Button>
    </Demo>
  </Doc>
)
```

Then aggregate your documentation files into a single DocsApp:

```tsx
import { ButtonDocs } from "./Button.docs"
import { TooltipDocs } from "./TooltipDocs.docs"
import { DocsApp } from "codedocs"
import React from "react"
import { render } from "react-dom"

export const MyDocs: React.FC = () => (
  <DocsApp docs={[ButtonDocs, TooltipDocs]} />
)
```

The easiest way to deploy your documentation side is using Codedocs.io. You can deploy by running:

```
npm run codedocs login
npm run codedocs deploy path/to/my-docs
```

If you'd like to self-host, you can do that either:

<ol type="a">
<li>Set up a basic React app and then mounting your DocsApp inside, or<br/></li>
<li>Mount your DocsApp directly in your existing app. You likely already have your component library set up in your app, so you can just add a /docs route and mount `MyDocs` there.</li>
</ol>


## Features

### Public-facing documentation

Use unrestricted HTML to build your documentation. Codedocs looks great as a public-facing documentation site:

<img alt="screenshot" src="docs/html.png" width="826" />

### Real code samples

Code samples are taken directly from your source. These can be JSX, or full renderers including hooks and other boilerplate.

<img alt="screenshot" src="docs/source.png" width="422" />

You can even do demos that require multiple interacting parts, for example to demonstrate a context provider and a hook:

<img alt="screenshot" src="docs/multi-component-demos.gif" width="415" />

### Variants

```tsx
<Demo
  inline
  variants={["aqua", "bisque", "coral"]}
  render={({ variant }) => /* ... */}
/>
```

<img alt="screenshot" src="docs/variants.png" width="340" />

### And more...

Simple state helper for demos that just need basic set/get functionality:

<img alt="screenshot" src="docs/state.gif" width="411" />

## Context Providers

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

## Development

To clone Codedocs and run the dev server:

```bash
git clone https://github.com/erikpukinskis/codedocs.git
cd codedocs
yarn install
yarn build
yarn start:docs:dev
```

The dev server will be available at [http://localhost:2030](http://localhost:2030) by default.

## What it doesn't do

- **Doesn't** work with anything other than React and React Router. If you are using Svelte or Ember you're out of luck.
- **Doesn't** provide interactive "knobs". Demos are just code samples. If you want to change the demo, you change the code.
- **Doesn't** magically scan through your source tree and "analyze" it. Magic is great when it works, until it doesn't. Your Codedocs are _just a normal React component_. You build it right alongside your components, within the same build system.
- **Doesn't** set up the devevelopment or deploy scripts for you. You are a professional application developer. You've probably already set up lots of infrastructure for deploying apps using your Design System. You can keep doing that. The `codedocs` package provides some React components that make it easy to turn documentation files into site.

The other thing is doesn't do is _have any dependencies_. You provide React and React Router as peerDependencies, and that's it.

## Example

For an example, check out Codedocs own docs in [/docs](/docs). You can see these running by cloning this repo and running `npm run start:docs:dev`.

## Future

The general philosophy of Codedocs is

1. It's OK to manually maintain documentation, not everything has to be magic
2. WYSYWIG editing is for designers to work with prose, tokens, and mockups. NOT components. Components are edited in code.
3. Work within the existing build
4. Give the best possible realtime feedback

Roadmap to 1.0

- [x] Render demos
- [x] Site sections, pages, homepage, nav
- [x] Prose documentation (HTML)
- [x] Publish static sites
- [x] Search
- [x] Demos with state, hooks, etc
- [x] Extract source vía macro
- [x] Show events emitted from demos
- [x] Variant demos
- [ ] Remove include-wrapper-in-source in favor of includeWrapperInSource prop. Also make sure includeWrapperInSource prop is removed from source (inception).
- [ ] Disallow with <Demo render={...}>...</Demo>, <Demo dependencies={...}>...</Demo>, etc
- [ ] Persistence
- [ ] Props palette


- [ ] ApiReference
- [ ] Dark mode
- [ ] Contact sheet
- [ ] Live edit demos (at least on localhost)
- [ ] Live edit headings, paragraphs, etc
- [ ] Visual tests
- [ ] Fullscreen demos

## Inspiration

- https://wattenberger.com/blog/react-and-d3
- https://stitches.dev/docs/variants
- https://eslint.org/docs/latest/user-guide/configuring/configuration-files
- https://www.apollographql.com/docs/react/
- https://evergreen.segment.com/components/table
- https://docs.drone.io/runner/kubernetes/configuration/resources/
