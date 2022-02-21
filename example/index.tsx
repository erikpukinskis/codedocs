import * as ButtonDocs from './Button.docs'
import { DocsApp } from 'design-docs'
import React from 'react'
import { render } from 'react-dom'

type Container = React.FC<{ children: React.ReactNode }>

const PageHeading: Container = ({ children }) => (
  <div role="heading" aria-level="1" style={{ fontSize: '1.5em', fontWeight: 600, paddingBottom: '10px' }}>{children}</div>
)

const DesignSystemProvider: Container = ({ children }) => (
  <div style={{ fontFamily: 'sans-serif'}}>{children}</div>
)

render(
  <DocsApp
    docs={[ButtonDocs]}
    DesignSystemProvider={DesignSystemProvider}
    PageHeading={PageHeading}
  />,
  document.getElementById('root')
);
