// @codedocs include-wrapper-in-source
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Demo, Doc, Placeholder } from "../macro"
import { Code } from "~/Code"

export const DemoDocs = (
  <Doc path="/Docs/Demos">
    <h2>Full Width</h2>
    <Demo>
      <Placeholder>By default, demos will be rendered full-width.</Placeholder>
    </Demo>
    <h2>Inline</h2>
    <Demo inline>
      <Placeholder style={{ width: "200px" }}>
        Inline demos only grow to fit the content width.
      </Placeholder>
    </Demo>
    <Demo inline>
      <FontAwesomeIcon icon="check" />
    </Demo>
    <h2>Render Prop</h2>
    <p>
      If your demo needs state, or other hooks, you can provide a render prop
      instead of children:
    </p>
    <Demo
      inline
      render={() => {
        const [count, setCount] = useState(0)
        return (
          <button onClick={() => setCount(count + 1)}>
            Click me ({count})
          </button>
        )
      }}
    />
    <h2>Mock Callbacks/Handlers</h2>
    <p>
      You can also track callbacks in the demo using a mock callback factory.
      For example, a mouse handler:
    </p>
    <Demo
      inline
      render={({ mock }) => (
        <button onClick={mock.callback("handleClick")}>
          Fire a mouse event
        </button>
      )}
    />
    <p>Or a callback with some other arguments:</p>
    <Demo
      inline
      render={({ mock }) => {
        const handleArgs = mock.callback("handleArgs")

        return (
          <button
            onClick={() =>
              handleArgs(
                400,
                function baz() {
                  return true
                },
                new Date()
              )
            }
          >
            Fire custom callback
          </button>
        )
      }}
    />
    <h2>Basic State</h2>
    <p>
      Your render function will also be provided with a very basic state setter
      and getter.
    </p>
    <p>
      You can set an explicit type on a <code>defaultValue</code> if you are in
      strict mode.
    </p>
    <Demo
      inline
      defaultValue={"" as string | undefined}
      render={({ value, setValue }) => (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
    />
    <h2>Multi-component demos</h2>
    <p>
      Sometimes you want to demonstrate something that requires some additional
      components, hooks, etc. You can specify additional "dependencies" that can
      be used by your render function. For example, when you want to demonstrate
      a context provider and a hook:
    </p>
    <Demo
      only
      noWrapperInSource
      dependencies={{
        ChildComponent: () => {
          const data = useMyHook()
          return <>{data}</>
        },
      }}
      render={({ ChildComponent }) => {
        return (
          <MyProvider>
            <ChildComponent />
          </MyProvider>
        )
      }}
    />
    <h2>Overflowing Elements</h2>
    <p>
      Elements which are too wide to fit in the document content div are allowed
      to overflow, but you will see the crop marks where the overflow happens.
    </p>
    <p>A fullscreen mode demos that need more space is coming soon.</p>
    <Demo inline>
      <Placeholder style={{ whiteSpace: "nowrap" }}>
        Elements which are too wide to fit in the document content div are
        allowed to overflow, but you will see the crop marks where the overflow
        happens.
      </Placeholder>
    </Demo>
    <h2>Errors In Demos</h2>
    <p>When an error occurs in a demo, it will be caught and displayed:</p>
    <Demo
      render={() => {
        throw new Error("This is a test error")
      }}
    />
    <h2>Skipping demos</h2>
    If you have a broken demo that you would like to ignore temporarily, you can
    add the <code>skip</code> prop:
    <Demo
      skip
      render={() => {
        throw new Error("This component would crash")
      }}
    />
    <h2>Focus mode</h2>
    <p>
      You can focus on a specific demo (or three) by adding the{" "}
      <code>only</code> prop:
    </p>
    <Code
      mode="tsx"
      source={`<h2>Focused demo</h2>
<p>Additional elements back to the preceding heading will be shown.</p>
<Demo only>This demo will be rendered</Demo>

<h2>Hidden demo</h2>
<p>Content around the hidden demos is hidden too.</p>
<Demo>This demo will be hidden</Demo>`}
    />
    <h2>Absolute Positioned Content</h2>
    <p>
      If you would like to expand the demo area to include some absolute
      positioned content, you can pass selectors to include in the demo area.
    </p>
    <p>
      Note that this bounding box is only calculated once after the demo is
      mounted, not for updates.
    </p>
    <Demo inline boundingSelectors={["#dropdown"]}>
      <Placeholder style={{ position: "relative" }}>
        Selected
        <Placeholder
          id="dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            whiteSpace: "nowrap",
          }}
        >
          Option 1
          <br />
          Option 2
          <br />
          Option 3
        </Placeholder>
      </Placeholder>
    </Demo>
  </Doc>
)

const MyProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Placeholder>
      <h3>MyProvider</h3>
      {children}
    </Placeholder>
  )
}

const useMyHook = () => {
  return "[hook data]"
}
