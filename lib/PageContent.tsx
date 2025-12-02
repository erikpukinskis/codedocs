import React from "react"
import { ErrorBoundary } from "./ErrorBoundary"
import { useComponents } from "~/ComponentContext"
import { type Page, type HomePage } from "~/helpers/buildSiteTree"
import { addSpaces } from "~/helpers/strings"

type PageContentProps = {
  page: Page
}

export const PageContent = ({ page }: PageContentProps) => {
  const Components = useComponents()

  return (
    <ErrorBoundary>
      <Components.PageHeading>{addSpaces(page.name)}</Components.PageHeading>
      {page.doc}
      {Object.entries(page.demos).map(([name, demo]) => (
        <React.Fragment key={name}>
          <Components.DemoHeading>{addSpaces(name)}</Components.DemoHeading>
          {demo}
        </React.Fragment>
      ))}
    </ErrorBoundary>
  )
}

type HomePageContentProps = {
  page: HomePage
}

export const HomePageContent = ({ page }: HomePageContentProps) => {
  return page.doc
}
