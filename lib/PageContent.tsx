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
    </ErrorBoundary>
  )
}

type HomePageComponentProps = {
  page: HomePage
  copyright: string
}

export const HomePageComponent = ({
  page,
  copyright,
}: HomePageComponentProps) => {
  const Components = useComponents()
  return (
    <Components.Columns>
      <Components.CenterColumn>
        {page.doc}
        <Components.Footer copyright={copyright} />
      </Components.CenterColumn>
    </Components.Columns>
  )
}
