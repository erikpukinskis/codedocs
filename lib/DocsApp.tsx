import React, { useMemo, type ReactNode } from "react"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import type { PageParent } from "./tree"
import {
  buildTree,
  type DocExport,
  type Page,
  isPage,
  type Site,
  isSite,
  type SiteSection,
  isSiteSection,
  type Category,
  isCategory,
  type SubCategory,
  isSubCategory,
  isParentWithPageChildren,
  getPageChildren,
  type HomePage,
  isHomePage,
} from "./tree"
import {
  Defaults,
  type Components,
  type Container,
  ComponentContextProvider,
  useComponents,
  type SocialProps,
} from "./components"
import { SideNav } from "./SideNav"
import { NotFound } from "./NotFound"
import { PageContent, HomePageContent } from "./PageContent"
import omit from "lodash/omit"
import { SearchContextProvider } from "./SearchContext"

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
            <Routes>
              <Route
                path="*"
                element={
                  <WildcardRoute
                    Components={Components}
                    logo={logo}
                    socialProps={socialProps}
                    pagesByPath={pagesByPath}
                  />
                }
              />
            </Routes>
          </BrowserRouter>
        </ComponentContextProvider>
      </DesignSystemProvider>
    </SearchContextProvider>
  )
}

type WildcardRouteProps = {
  logo: ReactNode
  socialProps: SocialProps
  pagesByPath: Record<string, Page | HomePage | PageParent>
  Components: Components
}

const WildcardRoute = ({
  logo,
  socialProps,
  pagesByPath,
  Components,
}: WildcardRouteProps) => {
  const location = useLocation()
  const path = location.pathname.slice(1) || "/"

  const currentPageOrParent = pagesByPath[path]

  if (!currentPageOrParent) {
    return <NotFound path={path} availablePaths={Object.keys(pagesByPath)} />
  }

  if (isHomePage(currentPageOrParent)) {
    const site: Site = {
      __typename: "Site",
      children: [],
      name: undefined as never,
      path: undefined as never,
      parent: undefined as never,
    }

    const sections = getSiteSections(site, pagesByPath)

    return (
      <>
        <Components.Header
          logo={logo}
          socialProps={socialProps}
          sections={sections}
        />
        <Components.MainColumn>
          <HomePageContent page={currentPageOrParent} />
        </Components.MainColumn>
      </>
    )
  }

  if (isPage(currentPageOrParent)) {
    return (
      <PageComponent
        logo={logo}
        socialProps={socialProps}
        page={currentPageOrParent}
      />
    )
  }

  const parent = currentPageOrParent

  const currentPage = pagesByPath[getFirstPagePath(parent)] as Page

  return (
    <PageComponent page={currentPage} socialProps={socialProps} logo={logo} />
  )
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
  logo: ReactNode
  socialProps: SocialProps
}

const PageComponent = ({ page, logo, socialProps }: PageComponentProps) => {
  const Components = useComponents()

  let parent = page.parent
  let pages: Page[] | undefined = undefined
  let currentSubCategory: SubCategory | undefined = undefined
  let currentCategory: Category | undefined = undefined
  let currentSection: SiteSection | undefined = undefined
  let site: Site | undefined = undefined

  while (parent) {
    if (!pages) {
      if (!isParentWithPageChildren(parent)) {
        throw new Error(
          `Parent ${
            parent.path as string
          } is the current page's parent but it has no children?`
        )
      }
      pages = getPageChildren(parent)
    }

    if (isSubCategory(parent)) {
      currentSubCategory = parent
    } else if (isCategory(parent)) {
      currentCategory = parent
    } else if (isSiteSection(parent)) {
      currentSection = parent
    } else if (isSite(parent)) {
      site = parent
    }
    parent = parent.parent
  }

  const allChildren = [
    ...(currentSection?.children ?? []),
    ...(currentCategory?.children ?? []),
    ...(currentSubCategory?.children ?? []),
  ]

  if (!site) {
    throw new Error(`No parent of ${page.path} is a Site`)
  }

  if (!currentSection) {
    throw new Error(`No parent of ${page.path} is a SiteSection`)
  }

  if (!pages) {
    throw new Error(
      `No sibling pages created... Page ${page.path} had no parent?`
    )
  }

  const categories = allChildren.filter(
    ({ __typename }) => __typename === "Category"
  ) as Category[]

  const subCategories = allChildren.filter(
    ({ __typename }) => __typename === "SubCategory"
  ) as SubCategory[]

  return (
    <>
      <Components.Header
        logo={logo}
        socialProps={socialProps}
        sections={site.children}
        currentSection={currentSection}
      />
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
    </>
  )
}

const getSiteSections = (site: Site, pagesByPath: Record<string, unknown>) => {
  const paths = Object.keys(pagesByPath)
  const sectionNames = new Set<string>()

  for (const path of paths) {
    const breadcrumbs = path.split("/")
    sectionNames.add(breadcrumbs[0])
  }

  const values = Array.from(sectionNames)

  const result = values.map(
    (name: string): SiteSection => ({
      __typename: "SiteSection",
      path: name,
      name: name,
      children: [],
      parent: site,
    })
  )

  return result
}
