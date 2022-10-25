import React from "react"
import { type Page } from "./tree"
import { useComponents } from "./components"
import { nameFromPath } from "./helpers"

type PageContentProps = {
  page: Page
}

export const PageContent = ({ page }: PageContentProps) => {
  const Components = useComponents()

  return (
    <>
      <Components.PageHeading>
        {nameFromPath(doc.props.path)}
      </Components.PageHeading>
      {doc}
      {Object.entries(demos).map(([name, demo]) => (
        <React.Fragment key={name}>
          <Components.DemoHeading>{addSpaces(name)}</Components.DemoHeading>
          {demo}
        </React.Fragment>
      ))}
    </>
  )
}

const addSpaces = (name: string) => {
  if (name.startsWith("_")) return name.replace("_", "")
  else return name.replace(/(.)([A-Z])/g, "$1 $2")
}
