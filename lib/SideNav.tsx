import type { Category, SubCategory, Page } from "./tree"

type SideNavProps = {
  categories: Category[]
  currentCategory?: Category
  subCategories: SubCategory[]
  currentSubCategory?: SubCategory
  pages: Page[]
  currentPage: Page
}

export const SideNav = ({
  categories,
  currentCategory,
  subCategories,
  currentSubCategory,
  pages,
  currentPage,
}: SideNavProps) => {
  return "Nav"
  // const links = (
  //   <>
  //     {categoriesInOrder(category.subcategories).map((subcategory) => (
  //       <Components.NavItem key={subcategory.name}>
  //         <Components.NavList>
  //           <CategoryLinks category={subcategory} Components={Components} />
  //         </Components.NavList>
  //       </Components.NavItem>
  //     ))}
  //     {category.docs.map((doc) => (
  //       <Components.NavItem key={doc.props.path}>
  //         <DocLink doc={doc} Components={Components} />
  //       </Components.NavItem>
  //     ))}
  //   </>
  // )

  // return (
  //   <>
  //     <Components.NavList>
  //       {category.name ? (
  //         <Components.NavHeading>{category.name}</Components.NavHeading>
  //       ) : null}
  //       {links}
  //     </Components.NavList>
  //   </>
  // )
}

type DocLinkProps = {
  doc: DocElement
  Components: Components
}

const DocLink = ({ doc, Components }: DocLinkProps) => {
  return (
    <Components.NavLink to={`/${doc.props.path}`}>
      {last(doc.props.path.split("/"))}
    </Components.NavLink>
  )
}

const last = <T,>(array: T[]) => array[array.length - 1]
