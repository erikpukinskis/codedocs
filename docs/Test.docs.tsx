// eslint-disable-next-line no-restricted-imports
import { Demo, Doc } from "../macro"

export const TestDocs = (
  <Doc path="/Docs/DocWithAVeryLongTitle">
    <p>...to test wrapping in the sidebar.</p>
    <h2>Two stateful demos in a row, to test the macro:</h2>
    <p>
      A{" "}
      <a href="https://www.redhat.com/en/topics/cloud-native-apps/stateful-vs-stateless">
        link about statefulness
      </a>
      .
    </p>
    <Demo
      defaultValue={true}
      render={({ value, mock }) => (
        <label id="x">
          <input
            type="checkbox"
            id="x"
            checked={value}
            onChange={mock.callback("onChange")}
          />
          label
        </label>
      )}
    />
    <Demo
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
