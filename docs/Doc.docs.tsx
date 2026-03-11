// @codedocs include-wrapper-in-source
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc, Placeholder } from "../macro"
import { Code } from "~/Code"

export const DocDocs = (
  <Doc path="/Docs/Doc">
    <p>
      Each page in your docs is a JSX element that you export from a .tsx file.
    </p>
    <p>
      By convention, docs go in a .docs.tsx file next to the component it
      documents. E.g., if your button component is in{" "}
      <code>components/Button/Button.tsx</code> then your docs would go in{" "}
      <code>components/Button/Button.docs.tsx</code>:
    </p>
    <Code
      mode="tsx"
      source={`import { Button } from "./Button"

export const ButtonDocs = (
  <Doc path="/Docs/Button">
    <p>Buttons are actuators for actions (exception page transitions:</p>
    <Demo>
      <Button>OK</Button>
    </Demo>
  </Doc>
)`}
    />
    <h2>Document structure</h2>
    <h3>You're in charge.</h3>
    <p>
      You can write your docs however you like, using the full capabilities of
      HTML and React.
    </p>
    <Demo>
      <Placeholder>
        However, the workhorse of Codedocs is the <code>&lt;Demo&gt;</code>{" "}
        component.
      </Placeholder>
    </Demo>
    <h3>Find out more...</h3>
    <ul>
      <li>
        <a href="/Docs/Demo">Demos</a> are snippets of code that demonstrate how
        to use a component.
      </li>
      <li>
        <a href="/Docs/Mockup">Mockups</a> are how designers build prototypes.
      </li>
    </ul>
  </Doc>
)
