import React from "react"
import { ErrorBoundary } from "./ErrorBoundary"
import { useComponents } from "~/ComponentContext"
import { type Page, type HomePage } from "~/helpers/buildSiteTree"
import { parseDocChunks, filterChunks } from "~/helpers/parseDocChunks"
import { addSpaces } from "~/helpers/strings"

type PageContentProps = {
  page: Page
}

export const PageContent = ({ page }: PageContentProps) => {
  const Components = useComponents()

  const allChunks = parseDocChunks(page.doc.props.children)
  const chunks = filterChunks(allChunks)

  return (
    <ErrorBoundary>
      <Components.PageHeading>{addSpaces(page.name)}</Components.PageHeading>
      {chunks.map((chunk, index) => (
        <React.Fragment key={index}>{chunk.elements}</React.Fragment>
      ))}
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

  const allChunks = parseDocChunks(page.doc.props.children)
  const chunks = filterChunks(allChunks)

  return (
    <Components.Columns>
      <Components.CenterColumn>
        {chunks.map((chunk, index) => (
          <React.Fragment key={index}>{chunk.elements}</React.Fragment>
        ))}
        <Components.Footer copyright={copyright} />
      </Components.CenterColumn>
    </Components.Columns>
  )
}
