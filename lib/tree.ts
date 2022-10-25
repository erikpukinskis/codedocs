type ProplessComponent = React.FC<Record<string, never>>

export type DocExport = Record<string, ProplessComponent> & {
  default: JSX.Element
}

export type DocElement = React.ReactElement<
  { path: string; order?: number },
  never
>

type DemoSet = Record<string, ProplessComponent>

export type PageParent = Site | SiteSection | Category | SubCategory

export type Site = {
  __typename: "Site"
  name: never
  path: never
  children: SiteSection[]
  parent: never
}

export function isSite(parent: PageParent): parent is Site {
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

export type SiteSection = {
  __typename: "SiteSection"
  path: string
  name: string
  children: (Page | Category)[]
  order?: number
  parent: Site
}

export function isSiteSection(parent: PageParent): parent is SiteSection {
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

export function isCategory(parent: PageParent): parent is Category {
  return parent.__typename === "Category"
}

export type SubCategory = {
  __typename: "SubCategory"
  path: string
  name: string
  children: Page[]
  parent: Category
  order?: number
}

export function isSubCategory(parent: PageParent): parent is SubCategory {
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
      `Expected ${__typename} to have all Page children, but ${nonCategory.path} is a ${nonCategory.__typename}`
    )
  }
  return children as Category[]
}

export function getSubCategoryChildren(
  category: Category | undefined
): SubCategory[] {
  if (!category) return []

  const { __typename, children } = category

  const nonSubCategory = (children as ParentLike[]).find(
    (child) => child.__typename !== "SubCategory"
  )
  if (nonSubCategory) {
    throw new Error(
      `Expected ${__typename} to have all Page children, but ${nonSubCategory.path} is a ${nonSubCategory.__typename}`
    )
  }
  return children as SubCategory[]
}

export const buildTree = (docs: DocExport[]): Record<string, Page> => {
  const pagesByPath: Record<string, Page> = {}

  const site: Site = {
    __typename: "Site",
    path: undefined as never,
    name: undefined as never,
    children: [],
    parent: undefined as never,
  }

  docs.map((docsAndDemos) => {
    const doc = docsAndDemos.default as DocElement
    const demos: DemoSet = { ...docsAndDemos }
    delete demos.default

    const path = doc.props.path
    const order = doc.props.order
    const breadcrumbs = doc.props.path.split("/")

    if (breadcrumbs.length > 4) {
      throw new Error(
        `Doc path ${path} has too many segments, the maximum depth is [Site Section]/[Category]/[Subcategory]/[Page]`
      )
    }

    if (breadcrumbs.length < 2) {
      throw new Error(
        `Doc path ${path} is missing a site section. Try path="Docs/${path}"`
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

      const newParentType = isSite(parent)
        ? "SiteSection"
        : breadcrumbs.length === 2
        ? "Category"
        : breadcrumbs.length === 1
        ? "SubCategory"
        : undefined

      if (!newParentType) {
        throw new Error("Cannot determine page parent type")
      }

      const newParent: SiteSection | Category | SubCategory = {
        __typename: newParentType,
        path: breadcrumbs.join("/"),
        name: breadcrumb,
        children: [],
        parent,
      }

      parent.children.push(newParent)
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
  })

  return pagesByPath
}

function shift<T>(array: T[]) {
  const value = array.shift()
  if (!value) {
    throw new Error("Tried to shift value off of empty array")
  }
  return value
}
