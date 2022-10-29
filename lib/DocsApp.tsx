import React, { useMemo, type ReactNode } from "react"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import type { PageOrParent } from "@/tree"
import {
  buildTree,
  isPage,
  isHomePage,
  getNav,
  type DocExport,
  type Page,
  type PageParent,
  type HomePage,
  type SiteSection,
} from "@/tree"
import { ComponentContextProvider, useComponents } from "@/ComponentContext"
import {
  type Container,
  type Components,
  type SocialProps,
} from "@/ComponentTypes"
import * as Defaults from "@/Components"
import { SideNav } from "@/SideNav"
import { NotFound } from "@/NotFound"
import { PageContent, HomePageContent } from "@/PageContent"
import omit from "lodash/omit"
import { SearchContextProvider } from "@/SearchContext"

type DocsAppProps = Partial<Components> &
  Partial<SocialProps> & {
    docs: DocExport[]
    logo: string | ReactNode
    githubUrl?: string
    DesignSystemProvider?: Container
  }

type ComponentName = keyof typeof Defaults

const COMPONENT_NAMES = Object.keys(Defaults) as ComponentName[]

export const DocsApp = ({
  docs,
  DesignSystemProvider = ({ children }) => <>{children}</>,
  logo,
  ...rest
}: DocsAppProps) => {
  const pagesByPath = useMemo(() => buildTree(docs), [docs])

  const ComponentOverrides = Object.keys(Defaults).reduce((overrides, key) => {
    const override = rest[key as ComponentName]
    return override
      ? {
          ...overrides,
          [key]: override,
        }
      : overrides
  }, {} as Partial<Components>)

  const socialProps = omit(rest, COMPONENT_NAMES) as SocialProps

  const Components = {
    ...Defaults,
    ...ComponentOverrides,
  }

  return (
    <SearchContextProvider pagesByPath={pagesByPath}>
      <DesignSystemProvider>
        <ComponentContextProvider Components={Components}>
          <BrowserRouter>
            <Header
              pagesByPath={pagesByPath}
              logo={logo}
              socialProps={socialProps}
            />
            <Routes>
              <Route
                path="*"
                element={<WildcardRoute pagesByPath={pagesByPath} />}
              />
            </Routes>
          </BrowserRouter>
        </ComponentContextProvider>
      </DesignSystemProvider>
    </SearchContextProvider>
  )
}

type HeaderProps = {
  pagesByPath: Record<string, PageOrParent>
  logo: ReactNode
  socialProps: SocialProps
}

const Header = ({ pagesByPath, logo, socialProps }: HeaderProps) => {
  const location = useLocation()
  const path = location.pathname.slice(1) || "/"
  const pageOrParent = pagesByPath[path]
  const Components = useComponents()

  return (
    <Components.Header
      logo={logo}
      socialProps={socialProps}
      sections={getSiteSections(pageOrParent)}
    />
  )
}

/**
 * We could potentially use getNav here to get the site sections, but that's a
 * pretty heavy function and we'd prefer to run it just once per page, so this
 * is a lighter weight version that just gets the site sections:
 */
const getSiteSections = (page: PageOrParent) => {
  let parent = page.parent

  while (parent.parent) {
    parent = parent.parent
  }

  const site = parent

  return site.children as SiteSection[]
}

type WildcardRouteProps = {
  pagesByPath: Record<string, Page | HomePage | PageParent>
}

const WildcardRoute = ({ pagesByPath }: WildcardRouteProps) => {
  const Components = useComponents()
  const location = useLocation()
  const path = location.pathname.slice(1) || "/"
  const currentPageOrParent = pagesByPath[path]

  if (!currentPageOrParent) {
    return <NotFound path={path} availablePaths={Object.keys(pagesByPath)} />
  } else if (isHomePage(currentPageOrParent)) {
    return (
      <Components.MainColumn>
        <HomePageContent page={currentPageOrParent} />
      </Components.MainColumn>
    )
  } else if (isPage(currentPageOrParent)) {
    return <PageComponent page={currentPageOrParent} />
  } else {
    // On parent pages we serve up the first page in the category
    const parent = currentPageOrParent

    const currentPage = pagesByPath[getFirstPagePath(parent)] as Page

    return <PageComponent page={currentPage} />
  }
}

const getFirstPagePath = (parent: PageParent) => {
  let path = parent.name

  while (parent) {
    const firstChild = parent.children[0]
    path += `/${firstChild.name}`
    if (isPage(firstChild)) {
      break
    }
    parent = firstChild
  }

  return path
}

type PageComponentProps = {
  page: Page
}

const PageComponent = ({ page }: PageComponentProps) => {
  const Components = useComponents()

  const {
    categories,
    currentCategory,
    subCategories,
    currentSubCategory,
    pages,
  } = getNav(page)

  return (
    <Components.Columns>
      <Components.LeftColumn>
        <SideNav
          {...{
            categories,
            currentCategory,
            subCategories,
            currentSubCategory,
            pages,
            currentPage: page,
          }}
        />
      </Components.LeftColumn>
      <Components.MainColumn>
        <PageContent page={page} />
      </Components.MainColumn>
    </Components.Columns>
  )
}
