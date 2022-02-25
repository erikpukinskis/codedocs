import * as ButtonDocs from './Button.docs'
import { DocsApp } from 'design-docs'
import React from 'react'
import { render } from 'react-dom'
import { Link } from 'react-router-dom';

type Container = React.FC<{ children: React.ReactNode }>

const PageHeading: Container = ({ children }) => (
  <div role="heading" aria-level="1">{children}</div>
)

const DesignSystemProvider: Container = ({ children }) => (
  <div><Styles />{children}</div>
)

const Link: typeof Link = (...props) => {
  <Link  {...props} />
}

const Styles = () => (
<>hello, world</>
)

render(
  <DocsApp
    docs={[ButtonDocs]}
    DesignSystemProvider={DesignSystemProvider}
    PageHeading={PageHeading}
  />,
  document.getElementById('root')
);
