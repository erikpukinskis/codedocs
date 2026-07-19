import React from "react"
// eslint-disable-next-line no-restricted-imports
import { Doc } from "../macro"

export const GettingStartedDocs = (
  <Doc path="/Docs/GettingStarted">
    <p>
      To get started in your own project, create your first documentation file:
    </p>

    <code data-language="tsx">
      {`
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
      `}
    </code>

    <p>Then aggregate your documentation files into a single DocsApp:</p>

    <code data-language="tsx">
      {`
import { ButtonDocs } from "./Button.docs"
import { TooltipDocs } from "./TooltipDocs.docs"
import { DocsApp } from "codedocs"
import React from "react"
import { render } from "react-dom"

export const MyDocs: React.FC = () => (
  <DocsApp docs={[ButtonDocs, TooltipDocs]} />
)
`}
    </code>

    <p>
      The easiest way to deploy your documentation side is using Codedocs.io.
      You can deploy by running:
    </p>

    <code data-language="bash">
      {`
        npm run codedocs login 
        npm run codedocs deploy path/to/my-docs
      `}
    </code>

    <p>If you'd like to self-host, you can do that either:</p>

    <ol type="a">
      <li>
        Set up a basic React app and then mounting your DocsApp inside, or
        <br />
      </li>
      <li>
        Mount your DocsApp directly in your existing app. You likely already
        have your component library set up in your app, so you can just add a
        /docs route and mount `MyDocs` there.
      </li>
    </ol>
  </Doc>
)
