import React, { useMemo, type ReactNode } from "react"
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom"
import {
  buildTree,
  type DocExport,
  type Page,
  type Site,
  isSite,
  type SiteSection,
  isSiteSection,
  type Category,
  isCategory,
  type SubCategory,
  isSubCategory,
  isParentWithChildren,
  getPageChildren,
  getSubCategoryChildren,
  getCategoryChildren,
} from "./tree"
import {
  Defaults,
  type Components,
  type Container,
  ComponentContextProvider,
} from "./components"
import { SideNav } from "./SideNav"
import { NotFound } from "./NotFound"
import { PageContent } from "./PageContent"

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
            <Route path="/" element={<>Welcome!</>} />
            <Route
              path="*"
              element={
                <WildcardRoute
                  logo={logo}
                  pagesByPath={pagesByPath}
                  Components={Components}
                />
              }
            />
          </Routes>
        </ComponentContextProvider>
      </BrowserRouter>
    </DesignSystemProvider>
  )
}

type WildcardRouteProps = {
  logo: ReactNode
  pagesByPath: Record<string, Page>
  Components: Components
}

const WildcardRoute = ({
  logo,
  pagesByPath,
  Components,
}: WildcardRouteProps) => {
  const location = useLocation()
  const path = location.pathname.slice(1)

  if (!path) {
    throw new Error("homepage?")
  }

  const currentPage = pagesByPath[path]

  if (!currentPage) {
    return (
      <NotFound
        {...{ path, Components }}
        availablePaths={Object.keys(pagesByPath)}
      />
    )
  }

  let parent = currentPage.parent
  let pages: Page[] | undefined = undefined
  let currentSubCategory: SubCategory | undefined = undefined
  let currentCategory: Category | undefined = undefined
  let currentSection: SiteSection | undefined = undefined
  let site: Site | undefined = undefined

  while (parent) {
    if (!pages) {
      if (!isParentWithChildren(parent)) {
        throw new Error(
          `Parent ${parent.path} is the current page's parent but it has no children?`
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

  if (!site) {
    throw new Error(`No parent of ${path} is a Site`)
  }

  if (!currentSection) {
    throw new Error(`No parent of ${path} is a SiteSection`)
  }

  if (!pages) {
    throw new Error(`No sibling pages created... Page ${path} had no parent?`)
  }

  return (
    <>
      <Components.Header
        logo={logo}
        sections={site.sections}
        currentSection={currentSection}
      />
      <Components.Columns>
        <Components.LeftColumn>
          <SideNav
            categories={getCategoryChildren(currentSection)}
            currentCategory={currentCategory}
            subCategories={getSubCategoryChildren(currentCategory)}
            currentSubCategory={currentSubCategory}
            pages={pages}
            currentPage={currentPage}
          />
        </Components.LeftColumn>
        <Components.MainColumn>
          <PageContent page={currentPage} />
        </Components.MainColumn>
      </Components.Columns>
    </>
  )
}
