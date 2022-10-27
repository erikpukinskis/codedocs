import React from "react"
import { nameFromPath } from "@/helpers"
import { useComponents } from "@/ComponentContext"

type NotFoundProps = {
  path: string
  availablePaths: string[]
}

export const NotFound = ({ path, availablePaths }: NotFoundProps) => {
  const componentName = nameFromPath(path)
  const { PageHeading, MainColumn } = useComponents()

  return (
    <MainColumn>
      <PageHeading>404 - Not Found</PageHeading>

      <p>
        None of the docs you passed to <code>&lt;DocsApp&gt;</code> have the
        path <code>&quot;{path}&quot;</code>
      </p>

      <p>Try:</p>

      <pre>{`// path/to/${componentName}.doc.tsx
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
`}</pre>

      <p>Here are all the paths which were found:</p>
      <ul>
        {availablePaths.map((path) => (
          <li key={path}>
            <code>&quot;{path}&quot;</code>
          </li>
        ))}
      </ul>
    </MainColumn>
  )
}
