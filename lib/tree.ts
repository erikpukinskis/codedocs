import { getPathSegments } from "~/helpers"

export type DocExport = Record<string, JSX.Element>

export type DocElement = React.ReactElement<
  { path: string; order?: number },
  never
>

type DemoSet = Record<string, JSX.Element>

export type PageParent = Site | SiteSection | Category | SubCategory

export type Site = {
  __typename: "Site"
  name: never
  path: never
  children: SiteSection[]
  parent: never
}

export function isSite(parent: PageOrParent): parent is Site {
  return parent.__typename === "Site"
}

export type Page = {
  __typename: "Page"
  path: string
  name: string
  doc: DocElement
  demos: DemoSet
  parent: PageParent
  order?: number
}

export type HomePage = {
  __typename: "HomePage"
  path: "/"
  doc: DocElement
  demos: DemoSet
  // Making the HomePage a child of the Site is a little weird, because it's not
  // one of the Site's "children" (those are SiteSections). But we made the Site
  // the HomePage's parent so that every page has a parent and you can grab the
  // Site by getting pagesByPath[path].parent.parent.parent...
  //
  // That said, it might be better to just have the HomePage be in the Site's
  // children and when we need to get the SiteSections we'd just filter it out.
  parent: Site
}

export type PageOrParent = Page | HomePage | PageParent

export function isHomePage(page: PageOrParent): page is HomePage {
  return page.__typename === "HomePage"
}

export function isPage(page: PageOrParent): page is Page {
  return page.__typename === "Page"
}

export type SiteSection = {
  __typename: "SiteSection"
  path: string
  name: string
  children: (Page | Category)[]
  order?: number
  parent: Site
}

export function isSiteSection(parent: PageOrParent): parent is SiteSection {
  return parent.__typename === "SiteSection"
}

export type Category = {
  __typename: "Category"
  path: string
  name: string
  children: (Page | SubCategory)[]
  parent: SiteSection
  order?: number
}

export function isCategory(parent: PageOrParent): parent is Category {
  return parent.__typename === "Category"
}

export type SubCategory = {
  __typename: "SubCategory"
  path: string
  name: string
  children: Page[]
  parent: SiteSection | Category
  order?: number
}

export function isSubCategory(parent: PageOrParent): parent is SubCategory {
  return parent.__typename === "SubCategory"
}

export function isParentWithPageChildren(
  parent: PageParent
): parent is SiteSection | Category | SubCategory {
  return parent.__typename !== "Site"
}

type ParentLike = {
  path: string
  __typename: string
}

export function getPageChildren({
  __typename,
  children,
}: SiteSection | Category | SubCategory): Page[] {
  const nonPage = (children as ParentLike[]).find(
    (child) => child.__typename !== "Page"
  )
  if (nonPage) {
    throw new Error(
      `Expected ${__typename} to have all Page children, but ${nonPage.path} is a ${nonPage.__typename}`
    )
  }
  return children as Page[]
}

export function getCategoryChildren({
  __typename,
  children,
}: SiteSection): Category[] {
  const nonCategory = (children as ParentLike[]).find(
    (child) => child.__typename !== "Category"
  )
  if (nonCategory) {
    throw new Error(
      `Expected ${__typename} to have all Category children, but ${nonCategory.path} is a ${nonCategory.__typename}`
    )
  }
  return children as Category[]
}

export function getSubCategoryChildren(
  category: SiteSection | Category | undefined
): SubCategory[] {
  if (!category) return []

  const { __typename, children } = category

  const nonSubCategory = (children as ParentLike[]).find(
    (child) => child.__typename !== "SubCategory"
  )
  if (nonSubCategory) {
    throw new Error(
      `Expected ${__typename} to have all SubCategory children, but ${nonSubCategory.path} is a ${nonSubCategory.__typename}`
    )
  }
  return children as SubCategory[]
}

/**
 * Takes all of the doc exports and builds a tree of nested
 * site/section/category/subcategory/page objects with parents, children, and
 * all the necessary metadata we need to render them.
 */
export const buildTree = (docs: DocExport[]): Record<string, PageOrParent> => {
  const pagesByPath: Record<string, PageOrParent> = {}

  const site: Site = {
    __typename: "Site",
    path: undefined as never,
    name: undefined as never,
    children: [],
    parent: undefined as never,
  }

  for (const docsAndDemos of docs) {
    const doc = docsAndDemos.default as DocElement
    if (!/^\//.test(doc.props.path)) {
      throw new Error(
        `Doc paths must start with a /... try <Doc path="/${doc.props.path}">`
      )
    }
    const demos: DemoSet = { ...docsAndDemos }
    delete demos.default

    const path = doc.props.path
    const order = doc.props.order
    const breadcrumbs = getPathSegments(doc.props.path)

    if (path === "/") {
      pagesByPath["/"] = {
        __typename: "HomePage",
        path: "/",
        doc,
        demos,
        parent: site,
      }
      continue
    }

    if (breadcrumbs.length > 4) {
      throw new Error(
        `Doc path ${path} has too many segments, the maximum depth is [Site Section]/[Category]/[Subcategory]/[Page]`
      )
    }

    if (breadcrumbs.length < 2) {
      throw new Error(
        `Doc path ${path} is missing a site section. Try path="/Docs/${path}" or path="/" for the home page`
      )
    }

    let parent: PageParent = site

    while (breadcrumbs.length > 1) {
      const breadcrumb = shift(breadcrumbs)

      const nextParentDown: PageParent | undefined = (
        parent.children as PageParent[]
      ).find((child) => child.name === breadcrumb)

      if (nextParentDown) {
        parent = nextParentDown
        continue
      }

      const commonParentProperties = {
        path: getParentPath(breadcrumb, parent),
        name: breadcrumb,
        children: [],
      }

      let newParent: PageParent

      if (isSite(parent)) {
        newParent = {
          __typename: "SiteSection",
          ...commonParentProperties,
          parent,
        }
        pagesByPath[commonParentProperties.path] = newParent
        parent.children.push(newParent)
      } else if (breadcrumbs.length === 2 && isSiteSection(parent)) {
        newParent = {
          __typename: "Category",
          ...commonParentProperties,
          parent,
        }
        pagesByPath[commonParentProperties.path] = newParent
        parent.children.push(newParent)
      } else if (
        breadcrumbs.length === 1 &&
        (isCategory(parent) || isSiteSection(parent))
      ) {
        newParent = {
          __typename: "SubCategory",
          ...commonParentProperties,
          parent,
        }
        pagesByPath[commonParentProperties.path] = newParent
        ;(parent as Category).children.push(newParent)
      } else {
        throw new Error(
          `Unable to determine parent type for ${breadcrumb} within ${path}`
        )
      }

      parent = newParent
    }

    const page: Page = {
      __typename: "Page",
      path,
      name: breadcrumbs[0],
      doc,
      demos,
      parent,
      order,
    }

    if (isSite(parent)) {
      throw new Error(`Final parent of page ${path} was a Site?`)
    }

    parent.children.push(page)

    pagesByPath[path] = page
  }

  return pagesByPath
}

function shift<T>(array: T[]) {
  const value = array.shift()
  if (!value) {
    throw new Error("Tried to shift value off of empty array")
  }
  return value
}

const getParentPath = (breadcrumb: string, parent: PageParent) => {
  let path = `/${breadcrumb}`
  while (parent?.name) {
    path = `${parent.name}/${path}`
    parent = parent.parent
  }
  return path
}

/**
 * Takes a page and returns arrays of sections, categories, etc such that we
 * could render the page layout.
 */
export const getNav = (page: Page) => {
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

  return {
    site,
    currentSection,
    categories,
    currentCategory,
    subCategories,
    currentSubCategory,
    pages,
  }
}
