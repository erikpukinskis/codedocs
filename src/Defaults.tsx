
import React from 'react'
import { Link } from 'react-router-dom'

type Container = React.FC<{ children: React.ReactNode }>

export const NavLink = Link

export const Columns: Container = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'row', position: 'absolute', height: '100%', top: 0, left: 0 }}>{children}</div>
)

export const LeftColumn: Container = ({ children }) => (
  <nav style={{ background: '#EEE', width: '128px', flexShrink: 0, padding: '20px' }}>{children}</nav>
)

export const MainColumn: Container = ({ children }) => (
  <div style={{ padding: '20px' }}>{children}</div>
)

export const PageHeading: Container = ({ children }) => (
  <div role="heading" aria-level={1} style={{ fontWeight: 600, paddingBottom: '10px' }}>{children}</div>
)

export const DemoHeading: Container = ({ children }) => (
  <div role="heading" aria-level={2} style={{ fontWeight: 600, paddingTop: '40px', paddingBottom: '10px' }}>{children}</div>
)

export const NavList: Container = ({ children }) => (
  <div role="list">{children}</div>
)

export const NavItem: Container = ({ children }) => (
  <div role="listitem">{children}</div>
)

export const NavHeading: Container = ({ children }) => (
  <div role="heading" aria-level={1} style={{ fontWeight: 600, padding: '10px 0' }}>{children}</div>
)

const CODE_STYLES = {fontFamily: `"andale mono", monospace`,
    fontSize: "14px",
    background: "#f9f9f9",
    borderRadius: "4px",
    lineHeight: "18px",
  }

export const Code: Container = ({ children }) => (
  <code style={{...CODE_STYLES,     padding: "2px"
}}>{children}</code>)

export const Pre: Container = ({ children }) => (
  <pre style={{...CODE_STYLES,     padding: "10px"}}>{children}</pre>)

