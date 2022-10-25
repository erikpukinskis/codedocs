import React from "react"
import { type Page, type HomePage } from "./tree"
import { useComponents } from "./components"
import { nameFromPath, addSpaces } from "./helpers"

type PageContentProps = {
  page: Page
}

export const PageContent = ({ page }: PageContentProps) => {
  const Components = useComponents()

  return (
    <>
      <Components.PageHeading>
        {nameFromPath(page.doc.props.path)}
      </Components.PageHeading>
      {page.doc}
      {Object.entries(page.demos).map(([name, demo]) => (
        <React.Fragment key={name}>
          <Components.DemoHeading>{addSpaces(name)}</Components.DemoHeading>
          {demo}
        </React.Fragment>
      ))}
    </>
  )
}

type HomePageContentProps = {
  page: HomePage
}

export const HomePageContent = ({ page }: HomePageContentProps) => {
  return page.doc
}
