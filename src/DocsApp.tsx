import React, { useMemo } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import * as Defaults from './Defaults';

type DocSet = Record<string, JSX.Element>

type Components = {
  Columns: Container
  LeftColumn: Container
  MainColumn: Container
  NavLink: React.FC<{ to: Parameters<typeof Link>[0]['to'] }>
  NavList: Container
  NavHeading: Container
  NavItem: Container
  PageHeading: Container
  DemoHeading: Container
}

type UseDocsAppOptions = Partial<Components> & {
  docs: DocSet[]
  DesignSystemProvider?: Container
}

type Container = React.FC<{ children: React.ReactNode }>

const Passthrough: Container = ({ children }) => <>{children}</>

export const DocsApp = ({ docs, DesignSystemProvider = Passthrough, ...ComponentOverrides }: UseDocsAppOptions) => {
  const { tree, docsByPath, demosByPath } = useMemo(() => docsToTree(docs), [docs])

  const Components = {
    ...Defaults,
    ...ComponentOverrides
  }

  return (
    <DesignSystemProvider>
      <BrowserRouter>
        <Components.Columns>
          <Components.LeftColumn>
            <Components.NavList>
              <Components.NavItem>
                <Components.NavLink to="/">Introduction</Components.NavLink>
              </Components.NavItem>
              <CategoryLinks category={tree} Components={Components} />
            </Components.NavList>
          </Components.LeftColumn>
          <Components.MainColumn>
            <Routes>
              <Route
                path="/"
                element={<>Welcome!</>}
              />
              <Route
                path="*"
                element={<WildcardRoute docsByPath={docsByPath} demosByPath={demosByPath} Components={Components} />}
              />
            </Routes>
          </Components.MainColumn>
        </Components.Columns>
      </BrowserRouter>
    </DesignSystemProvider>
  )
}

type WildcardRouteProps = {
  docsByPath: Record<string, DocElement>
  demosByPath: Record<string, DemoSet>
  Components: Components
}

const WildcardRoute = ({ docsByPath, demosByPath, Components }: WildcardRouteProps) => {
  const location = useLocation()
  const path = location.pathname.slice(1)
  if (!path) return <>Welcome!</>

  const doc = docsByPath[path]
  const demos = demosByPath[path]

  return <DocRoute doc={doc} demos={demos} path={path} Components={Components} />
}

type Category = {
  name: string,
  subcategories: Record<string, Category>
  docs: DocElement[]
}

type DocElement = JSX.Element & {
  props: { path: string, order?: number };
}

type DemoSet = Record<string, JSX.Element>

const docsToTree = (docs: DocSet[]) => {
  const tree: Category = {
    name: '',
    subcategories: {},
    docs: [],
  }

  const demosByPath: Record<string, DemoSet> = {}
  const docsByPath: Record<string, DocElement> = {}

  docs.map((docsAndDemos) => {
    const doc = docsAndDemos.default as DocElement
    const demos = { ...docsAndDemos }
    delete demos.default
    demosByPath[doc.props.path] = demos
    docsByPath[doc.props.path] = doc
    const breadcrumbs = doc.props.path.split('/')
    let parent = tree
    while (breadcrumbs.length > 1) {
      const categoryName = breadcrumbs.shift()
      if (parent.subcategories[categoryName]) {
        parent = parent.subcategories[categoryName]
      } else {
        const category: Category = {
          name: categoryName,
          subcategories: {},
          docs: []
        }
        parent.subcategories[categoryName] = category
        parent = category
      }
    }
    parent.docs.push(doc)
  })

  return { tree, docsByPath, demosByPath }
}

type DocRouteProps = {
  doc: DocElement
  demos: Record<string, JSX.Element>
  path: string
  Components: Components
}

const DocRoute = ({ doc, demos, path, Components }: DocRouteProps) => {
  return <>
    <Components.PageHeading>{doc.props.path}</Components.PageHeading>
    {doc}
    {Object.entries(demos).map(([name, demo]) => (
      <React.Fragment key={name}>
        <Components.DemoHeading>{addSpaces(name)}</Components.DemoHeading>
        {demo}
      </React.Fragment>)
    )}
  </>
}

const addSpaces = (name: string) => {
  if (name.startsWith('_')) return name.replace('_', '')
  else return name.replace(/(.)([A-Z])/g, '$1 $2')
}

type CategoryLinksProps = {
  category: Category
  Components: Components
}

const CategoryLinks = ({ category, Components }: CategoryLinksProps) => {
  const links = (
    <>
      {categoriesInOrder(category.subcategories).map((subcategory) => (
        <Components.NavItem key={subcategory.name}>
          <Components.NavList>
            <CategoryLinks category={subcategory} Components={Components} />
          </Components.NavList>
        </Components.NavItem>
      ))}
      {category.docs.map((doc) => (
        <Components.NavItem key={doc.props.path}><DocLink doc={doc} Components={Components} /></Components.NavItem>
      ))}
    </>
  )

  return (
    <>
      {category.name && <Components.NavHeading>{category.name}</Components.NavHeading>}
      {links}
    </>
  )
}

type DocLinkProps = {
  doc: DocElement
  Components: Components
}

const DocLink = ({ doc, Components }: DocLinkProps) => {
  return (
    <Components.NavLink to={`/${doc.props.path}`}>{last(doc.props.path.split('/'))}</Components.NavLink>
  )
}

const last = <T extends any>(array: T[]) => array[array.length - 1]

const categoriesInOrder = (categories: Record<string, Category>) => {
  const list = Object.values(categories)
  list.sort((a, b) => categoryOrder(a) - categoryOrder(b))
  return list
}

const categoryOrder = (category: Category) => {
  return Math.min(...category.docs.map((doc) => doc.props.order || Infinity))
}
