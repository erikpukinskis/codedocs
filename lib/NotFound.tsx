import React from "react"
import { nameFromPath } from "./helpers"
import { useComponents } from "./components"

type NotFoundProps = {
  path: string
  availablePaths: string[]
}

export const NotFound = ({ path, availablePaths }: NotFoundProps) => {
  const componentName = nameFromPath(path)
  const { PageHeading, Code, Pre, MainColumn } = useComponents()

  return (
    <MainColumn>
      <PageHeading>404 - Not Found</PageHeading>

      <p>
        None of the docs you passed to <Code>&lt;DocsApp&gt;</Code> have the
        path <Code>&quot;{path}&quot;</Code>
      </p>

      <p>Try:</p>

      <Pre>{`// path/to/${componentName}.doc.tsx
import { Doc, Demo } from "codedocs"
import { ${componentName} } from "."

export const default = (
  <Doc path="${path}">
    Intro text goes here
  </Doc>
)

export const SomeDemoScenario = (
  <Demo>
    <${componentName} ... />
  </Demo>
)
`}</Pre>

      <p>Here are all the paths which were found:</p>
      <ul>
        {availablePaths.map((path) => (
          <li key={path}>
            <Code>&quot;{path}&quot;</Code>
          </li>
        ))}
      </ul>
    </MainColumn>
  )
}
