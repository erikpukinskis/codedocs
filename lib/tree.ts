export type DocExport = Record<string, JSX.Element>

export type DocElement = React.ReactElement<
  { path: string; order?: number },
  never
>

type ProplessComponent = React.FC<Record<string, never>>

type DemoSet = Record<string, ProplessComponent>

export type PageParent = Site | SiteSection | Category | SubCategory

export type Page = {
  __typename: "Page"
  path: string
  doc: DocElement
  demos: DemoSet
  parent: PageParent
  order?: number
}

export type Site = {
  __typename: "Site"
  path: "/"
  sections: SiteSection[]
  parent: never
}

export function isSite(parent: PageParent): parent is Site {
  return parent.__typename === "Site"
}

export type SiteSection = {
  __typename: "SiteSection"
  path: string
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
  children: Page[]
  parent: Category
  order?: number
}

export function isSubCategory(parent: PageParent): parent is SubCategory {
  return parent.__typename === "SubCategory"
}

export function isParentWithChildren(
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
  const sections: SiteSection[] = []

  return {}

  // const tree: Category = {
  //   name: "",
  //   subcategories: [],
  //   pages: [],
  // }

  // const demosByPath: Record<string, DemoSet> = {}
  // const docsByPath: Record<string, DocElement> = {}

  // docs.map((docsAndDemos) => {
  //   const doc = docsAndDemos.default as DocElement
  //   const demos = { ...docsAndDemos }
  //   delete demos.default

  //   demosByPath[doc.props.path] = demos
  //   docsByPath[doc.props.path] = doc
  //   const breadcrumbs = doc.props.path.split("/")
  //   let parent = tree

  //   while (breadcrumbs.length > 1) {
  //     const categoryName = shift(breadcrumbs)
  //     const existingCategory = parent.subcategories.find(
  //       (category) => category.name === categoryName
  //     )
  //     if (existingCategory) {
  //       parent = existingCategory
  //     } else {
  //       const category: Category = {
  //         name: categoryName,
  //         subcategories: [],
  //         docs: [],
  //       }
  //       parent.subcategories.push(category)
  //       parent = category
  //     }
  //   }
  //   parent.docs.push(doc)
  // })

  // return { tree, docsByPath, demosByPath }
}

function shift<T>(array: T[]) {
  const value = array.shift()
  if (!value) {
    throw new Error("Tried to shift value off of empty array")
  }
  return value
}
