import React from "react"
import { Doc } from ".."

export default (
  <Doc path="Docs/GettingStarted">
    <h2>Step 1: Set up an app</h2>
    We're assuming you've already done this, since you're an app developer.
    Another easy way to get an app set up is to use Confgen:
    <pre>
      {`confgen@latest @docs yarn git typescript react eslint prettier codedocs`}
    </pre>
    <h2>Step 2: Write some docs</h2>
    Codedocs should live next to your code. They can import from your code
    directly for demos:
    <pre>
      {`// Button.docs.tsx
import React from "react"
import { Doc, Demo } from "codedocs"
import { Button } from "./Button"

CRSV wght

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
)`}
    </pre>
    <h2>Step 3: Mount the docs somewhere</h2>
    <p>
      Again, we leave this up to you. You can just throw a new route in your
      site. Or, if you're using Confgen it will have set up a{" "}
      <code>yarn build:docs</code> command, as well as a github action for
      deploying to Github Pages.
    </p>
    <pre>
      {`import * as ButtonDocs from "./Button.docs"
    import { DocsApp } from "codedocs"
    import React from "react"
    import { render } from "react-dom"
    
    render(<DocsApp docs={[ButtonDocs]} />, document.getElementById("root"))
    `}
    </pre>
  </Doc>
)
