import type { ReactNode } from "react"
import React from "react"
import { Link as _Link } from "react-router-dom"
import type { SiteSection } from "./tree"
import { addSpaces } from "./helpers"
type Container = React.FC<{ children: React.ReactNode }>

export const GlobalStyles = () => (
  <>
    <link rel="preconnect" href="https://rsms.me/" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    <link
      href="https://fonts.googleapis.com/css2?family=Recursive:wght,CRSV,MONO@360,0,1&display=swap"
      rel="stylesheet"
    ></link>

    <style>{`
      body {
        margin: 0;
      }

      :root {
        font-family: 'Inter', sans-serif;
        font-size: 18px;
      }

      @supports (font-variation-settings: normal) {
        :root {
          font-family: 'Inter var', sans-serif; 
        }
      }

      h1, h2, h3, h4 {
        font-weight: normal;
      }

      pre {
        background: #444;
        color: white;
        padding: 12px;
        border-radius: 4px;
        font-family: 'Recursive', monospace;
        font-size: 16px;
      }

      a {
        text-decoration: none;
        color: teal;
      }
  `}</style>
  </>
)

export type HeaderProps = {
  logo: ReactNode
  sections: SiteSection[]
  currentSectionName?: string
}

export const Header = ({ logo, sections, currentSectionName }: HeaderProps) => (
  <div
    style={{
      borderBottom: "1px solid #DDD",
      padding: 24,
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <a
      href="/"
      style={{
        display: "block",
        fontWeight: 600,
        fontSize: "1.4em",
        marginTop: "-0.2em",
        marginBottom: "-0.2em",
      }}
    >
      {logo}
    </a>
    <div style={{ display: "flex", flexDirection: "row", gap: 16 }}>
      {sections.map(({ name }) => (
        <a
          key={name}
          href={`/${name}`}
          style={currentSectionName === name ? { color: "black" } : {}}
        >
          {addSpaces(name)}
        </a>
      ))}
    </div>
  </div>
)

export const NavLink = _Link

export const Link = _Link

export const Columns: Container = ({ children }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      minHeight: "100%",
    }}
  >
    {children}
  </div>
)

export const LeftColumn: Container = ({ children }) => (
  <nav
    style={{
      background: "#EEE",
      width: "128px",
      flexShrink: 0,
      padding: "20px",
    }}
  >
    {children}
  </nav>
)

export const MainColumn: Container = ({ children }) => (
  <div style={{ padding: "20px" }}>{children}</div>
)

export const PageHeading: Container = ({ children }) => (
  <div
    role="heading"
    aria-level={1}
    style={{ fontWeight: 600, paddingBottom: "10px" }}
  >
    {children}
  </div>
)

export const DemoHeading: Container = ({ children }) => (
  <div
    role="heading"
    aria-level={2}
    style={{ fontWeight: 600, paddingTop: "40px", paddingBottom: "10px" }}
  >
    {children}
  </div>
)

export const NavList: Container = ({ children }) => (
  <div role="list">{children}</div>
)

export const NavItem: Container = ({ children }) => (
  <div role="listitem">{children}</div>
)

export const NavHeading: Container = ({ children }) => (
  <div
    role="heading"
    aria-level={1}
    style={{ fontWeight: 600, padding: "10px 0" }}
  >
    {children}
  </div>
)

const CODE_STYLES = {
  fontFamily: `"andale mono", monospace`,
  fontSize: "14px",
  background: "#f9f9f9",
  borderRadius: "4px",
  lineHeight: "18px",
}

export const Code: Container = ({ children }) => (
  <code style={{ ...CODE_STYLES, padding: "2px" }}>{children}</code>
)

export const Pre: Container = ({ children }) => (
  <pre style={{ ...CODE_STYLES, padding: "10px" }}>{children}</pre>
)
