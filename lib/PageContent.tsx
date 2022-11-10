import React from "react"
import { type Page, type HomePage } from "@/tree"
import { useComponents } from "@/ComponentContext"
import { addSpaces } from "@/helpers"
import { ErrorBoundary } from "./ErrorBoundary"

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
