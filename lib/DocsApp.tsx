import { type IconName } from "@fortawesome/fontawesome-common-types"
import omit from "lodash/omit"
import React, { useEffect, useMemo, type ReactNode } from "react"
import { Helmet } from "react-helmet"
import type { Location } from "react-router-dom"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import { ErrorBoundary } from "./ErrorBoundary"
import favicon from "./favicon.svg"
import { ComponentContextProvider, useComponents } from "~/ComponentContext"
import * as Defaults from "~/Components"
import {
  type Container,
  type Components,
  type SocialProps,
} from "~/ComponentTypes"
import {
  buildSiteTree,
  isPage,
  isHomePage,
  getNav,
  type DocExport,
  type Page,
  type PageParent,
  type HomePage,
  type SiteSection,
  type PageOrParent,
} from "~/helpers/buildSiteTree"
import { NotFound } from "~/NotFound"
import { PageContent, HomePageContent } from "~/PageContent"
import { SearchContextProvider } from "~/SearchContext"
import { SideNav } from "~/SideNav"

type DocsAppProps = Partial<Components> &
  Partial<SocialProps> & {
    docs: DocExport[]
    logo: string | ReactNode
    githubUrl?: string
    DesignSystemProvider?: Container
    icon: IconName
    copyright?: string
  }

type ComponentName = keyof typeof Defaults

const COMPONENT_NAMES = Object.keys(Defaults) as ComponentName[]

export const DocsApp = (props: DocsAppProps) => (
  <ErrorBoundary>
    <_DocsApp {...props}></_DocsApp>
  </ErrorBoundary>
)

const _DocsApp = ({
  docs,
  DesignSystemProvider = ({ children }) => <>{children}</>,
  logo,
  icon,
  copyright = "",
  ...rest
}: DocsAppProps) => {
  const pagesByPath = useMemo(() => buildSiteTree(docs), [docs])

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

  const components: Components = {
    ...Defaults,
    ...ComponentOverrides,
  }

  return (
    <SearchContextProvider pagesByPath={pagesByPath}>
      <Helmet>
        <link rel="icon" href={favicon} type="image/svg+xml" />
      </Helmet>
      <DesignSystemProvider>
        <ComponentContextProvider Components={components}>
          <BrowserRouter>
            <Defaults.LayoutContainer>
              <Routes>
                <Route
                  path="*"
                  element={
                    <WildcardRoute
                      pagesByPath={pagesByPath}
                      copyright={copyright}
                    />
                  }
                />
              </Routes>
              <Header
                pagesByPath={pagesByPath}
                logo={logo}
                icon={icon}
                socialProps={socialProps}
              />
            </Defaults.LayoutContainer>
          </BrowserRouter>
        </ComponentContextProvider>
      </DesignSystemProvider>
    </SearchContextProvider>
  )
}

type HeaderProps = {
  pagesByPath: Record<string, PageOrParent>
  logo: ReactNode
  icon: IconName
  socialProps: SocialProps
}

const getPathFromLocation = (location: Location) => {
  return location.pathname ? location.pathname : "/"
}

const Header = ({ pagesByPath, logo, icon, socialProps }: HeaderProps) => {
  const location = useLocation()
  const path = getPathFromLocation(location)
  const pageOrParent = pagesByPath[path]

  if (!pageOrParent) {
    throw new Error(`No page with path ${JSON.stringify(path)}`)
  }
  const Components = useComponents()

  return (
    <Components.Header
      logo={logo}
      icon={icon}
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
  copyright: string
}

const WildcardRoute = ({ pagesByPath, copyright }: WildcardRouteProps) => {
  const Components = useComponents()
  const location = useLocation()
  const path = getPathFromLocation(location)
  const currentPageOrParent = pagesByPath[path]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])

  if (!currentPageOrParent) {
    return <NotFound path={path} availablePaths={Object.keys(pagesByPath)} />
  } else if (isHomePage(currentPageOrParent)) {
    return (
      <Components.Columns>
        <Components.CenterColumn>
          <HomePageContent page={currentPageOrParent} />
          <Components.Footer copyright={copyright} />
        </Components.CenterColumn>
      </Components.Columns>
    )
  } else if (isPage(currentPageOrParent)) {
    return <PageComponent page={currentPageOrParent} copyright={copyright} />
  } else {
    // On parent pages we serve up the first page in the category
    const parent = currentPageOrParent

    const currentPage = pagesByPath[getFirstPagePath(parent)] as Page

    return <PageComponent page={currentPage} copyright={copyright} />
  }
}

const getFirstPagePath = (parent: PageParent) => {
  let path = `/${parent.name}`

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
  copyright: string
}

const PageComponent = ({ page, copyright }: PageComponentProps) => {
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
        <Components.Footer copyright={copyright} />
      </Components.MainColumn>
    </Components.Columns>
  )
}
