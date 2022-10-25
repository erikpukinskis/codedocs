import { useComponents } from "./components"
import type { Category, SubCategory, Page } from "./tree"
import { isCategory, isSubCategory } from "./tree"
import { addSpaces } from "./helpers"
import React from "react"

type SideNavProps = {
  categories: Category[]
  subCategories: SubCategory[]
  pages: Page[]
  currentCategory?: Category
  currentSubCategory?: SubCategory
  currentPage: Page
}

export const SideNav = ({
  categories,
  subCategories,
  pages,
  currentCategory,
  currentSubCategory,
  currentPage,
}: SideNavProps) => {
  const topLevelItems =
    categories.length > 0
      ? categories
      : subCategories.length > 0
      ? subCategories
      : pages

  return (
    <>
      {topLevelItems.map((item) => (
        <Nav key={item.name} item={item} />
      ))}
    </>
  )
}

type NavItemProps = {
  item: Category | SubCategory | Page
}

const Nav = ({ item }: NavItemProps) => {
  const Components = useComponents()

  if (isCategory(item)) {
    return (
      <>
        <Components.NavHeading>{addSpaces(item.name)}</Components.NavHeading>
        <Components.NavList>
          {item.children.map((subCategory) => (
            <Nav key={subCategory.name} item={subCategory} />
          ))}
        </Components.NavList>
      </>
    )
  } else if (isSubCategory(item)) {
    return (
      <>
        <Components.NavItem>{addSpaces(item.name)}</Components.NavItem>
        <Components.NavList>
          {item.children.map((page) => (
            <Nav key={page.name} item={page} />
          ))}
        </Components.NavList>
      </>
    )
  } else {
    return (
      <Components.NavItem>
        <Components.NavLink to={`/${item.doc.props.path}`}>
          {addSpaces(item.name)}
        </Components.NavLink>
      </Components.NavItem>
    )
  }
}
