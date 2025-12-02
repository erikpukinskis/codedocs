import React, { useState } from "react"
import { Demo } from "./Demo"
import * as styles from "./Demo.docs.css"
import { Doc } from "./Doc"

const Fill = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => (
  <div className={styles.fill} {...props}>
    {children}
  </div>
)

export default (
  <Doc path="/Docs/Demos">
    <h2>Full Width</h2>
    <Demo>
      <Fill>By default, demos will be rendered full-width.</Fill>
    </Demo>

    <h2>Inline</h2>
    <Demo inline>
      <Fill style={{ width: "200px" }}>
        Inline demos only grow to fit the content width.
      </Fill>
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
  </Doc>
)
