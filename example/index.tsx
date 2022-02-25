import * as ButtonDocs from "./Button.docs"
import { DocsApp } from "design-docs"
import React from "react"
import { render } from "react-dom"
import { Link } from "react-router-dom"

type Container = React.FC<{ children: React.ReactNode }>

const PageHeading: Container = ({ children }) => (
  <div className="page-heading" role="heading" aria-level="1">
    {children}
  </div>
)

const DesignSystemProvider: Container = ({ children }) => (
  <>
    <Styles />
    {children}
  </>
)

const NavLink: typeof Link = (props) => <Link className="link" {...props} />

const Styles = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
    body {
     font-family: sans-serif;
    }
    .page-heading {
      font-size: 1.5em;
      font-weight: 600;
      padding-bottom: 10px;
    }
    .link {
      color: green;
    }
    .link:visited {
      color: green;
    }
  `,
    }}
  />
)

render(
  <DocsApp
    docs={[ButtonDocs]}
    DesignSystemProvider={DesignSystemProvider}
    PageHeading={PageHeading}
    NavLink={NavLink}
  />,
  document.getElementById("root")
)
