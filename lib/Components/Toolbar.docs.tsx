// eslint-disable-next-line no-restricted-imports
import { Demo, Doc } from "../../macro"
import { useToolbar } from "./Toolbar"

export const ToolbarDocs = (
  <Doc path="/Components/Toolbar">
    <h2>Toolbar</h2>
    <Demo
      render={() => {
        const { getTriggerProps, Toolbar } = useToolbar()
        return (
          <>
            <button {...getTriggerProps()}>hover me</button>
            <Toolbar>👋</Toolbar>
          </>
        )
      }}
    />
  </Doc>
)
