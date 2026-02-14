// eslint-disable-next-line no-restricted-imports
import { Demo, Doc } from "../macro"

export const VeryLongDocumentPathDocs = (
  <Doc path="/Docs/DocWithAVeryLongTitle">
    <p>...to test wrapping in the sidebar.</p>
    <h2>Two stateful demos in a row, to test the macro:</h2>
    <Demo
      inline
      defaultValue={true}
      render={({ value }) => (
        <label id="x">
          <input
            type="checkbox"
            id="x"
            checked={value}
            onChange={(event) => {
              console.debug("checked?", event.target.checked)
            }}
          />
          label
        </label>
      )}
    />
    <Demo
      inline
      defaultValue={false}
      render={({ value, setValue }) => (
        <label>
          <input
            type="checkbox"
            checked={value}
            onChange={() => setValue(!value)}
          />
          Second checkbox
        </label>
      )}
    />
    <Demo>
      <h1>Hello, world!</h1>
      <p>This is a paragraph.</p>
    </Demo>
  </Doc>
)
