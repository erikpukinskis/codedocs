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
} from "./components"
import { SideNav } from "./SideNav"
import { NotFound } from "./NotFound"
import { PageContent, HomePageContent } from "./PageContent"

type DocsAppProps = Partial<Components> & {
  docs: DocExport[]
  logo: string | ReactNode
  DesignSystemProvider?: Container
}

export const DocsApp = ({
  docs,
  DesignSystemProvider = ({ children }) => <>{children}</>,
  logo,
  ...ComponentOverrides
}: DocsAppProps) => {
  const pagesByPath = useMemo(() => buildTree(docs), [docs])

  const Components = {
    ...Defaults,
    ...ComponentOverrides,
  }

  return (
    <DesignSystemProvider>
      <BrowserRouter>
        <ComponentContextProvider Components={Components}>
          <Routes>
            <Route
              path="*"
              element={<WildcardRoute logo={logo} pagesByPath={pagesByPath} />}
            />
          </Routes>
        </ComponentContextProvider>
      </BrowserRouter>
    </DesignSystemProvider>
  )
}

type WildcardRouteProps = {
  logo: ReactNode
  pagesByPath: Record<string, Page | HomePage | PageParent>
}

const WildcardRoute = ({ logo, pagesByPath }: WildcardRouteProps) => {
  const Components = useComponents()
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
        <Components.Header logo={logo} sections={sections} />
        <Components.MainColumn>
          <HomePageContent page={currentPageOrParent} />
        </Components.MainColumn>
      </>
    )
  }

  if (isPage(currentPageOrParent)) {
    return <PageComponent page={currentPageOrParent} />
  }

  const parent = currentPageOrParent

  const currentPage = pagesByPath[getFirstPagePath(parent)] as Page

  return <PageComponent page={currentPage} logo={logo} />
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
}

const PageComponent = ({ page, logo }: PageComponentProps) => {
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
