import React, { useRef, forwardRef } from "react"
import { Link as _Link } from "react-router-dom"
import { addSpaces } from "./helpers"
import githubLogoUrl from "./github.png"
import type {
  LinkProps,
  HeaderProps,
  SearchBoxProps,
  SocialProps,
  PopoverProps,
  Container,
} from "./ComponentContext"
import { useComponents } from "./ComponentContext"
import { useSearchQuery, useSearchResults } from "./SearchContext"
import { useLayer, useHover } from "react-laag"
import useKeyboardShortcut from "use-keyboard-shortcut"

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
        font-size: 18px;
        font-family: sans-serif;
        color: #222;
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
        font-size: 0.9em;
      }

      mark {
        background: none;
        font-weight: bold;
        color: #666;
      }

      code {
        padding: 0.2em;
        font-size: 0.9em;
        color: #9980fa;
        background: rgba(153,128,250,.1);
        border-radius: 4px;
        font-family: 'Recursive', monospace;
      }

      a {
        text-decoration: none;
        color: teal;
      }
  `}</style>
  </>
)

export const Popover = ({ target, contents }: PopoverProps) => {
  const [, hoverProps] = useHover()

  const { triggerProps, layerProps, renderLayer } = useLayer({
    isOpen: Boolean(contents),
    placement: "bottom-start",
  })

  return (
    <>
      <span {...triggerProps} {...hoverProps}>
        {target}
      </span>
      {contents &&
        renderLayer(
          <div className="tooltip" {...layerProps}>
            {contents}
          </div>
        )}
    </>
  )
}

export const Card: Container = ({ children }) => (
  <div
    style={{
      borderRadius: 4,
      padding: 16,
      border: "1px solid #DDD",
      background: "white",
    }}
  >
    {children}
  </div>
)

export const Header = ({
  logo,
  socialProps,
  sections,
  currentSection,
}: HeaderProps) => {
  const Components = useComponents()

  return (
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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 24,
          marginRight: 24,
        }}
      >
        <Components.Search />
        {sections.map(({ name }) => (
          <a
            key={name}
            href={`/${name}`}
            style={currentSection?.name === name ? { color: "black" } : {}}
          >
            {addSpaces(name)}
          </a>
        ))}
        <Social {...socialProps} />
      </div>
    </div>
  )
}

export const Search = () => {
  const Components = useComponents()
  const [query, setQuery] = useSearchQuery()
  const results = useSearchResults()
  const inputRef = useRef<HTMLInputElement>()

  useKeyboardShortcut(["Meta", "Shift", "F"], () => {
    inputRef.current?.focus()
  })

  return (
    <Components.Popover
      target={
        <Components.SearchBox
          ref={inputRef}
          value={query}
          onChange={setQuery}
        />
      }
      contents={
        results && results.length > 0 ? (
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {results?.map((result) => {
                return (
                  <a
                    style={{ display: "block", color: "inherit" }}
                    href={`/${result.path}`}
                    key={result.path}
                  >
                    <div style={{}}>{result.title}</div>
                    <div style={{ fontSize: "0.8em", color: "#888" }}>
                      {result.text}
                    </div>
                  </a>
                )
              })}
            </div>
          </Card>
        ) : null
      }
    />
  )
}

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  function SearchBox({ value, onChange }, inputRef) {
    return (
      <div style={{ position: "relative", width: "14em" }}>
        <Keys>
          <Key>command</Key>
          <Key>shift</Key>
          <Key>F</Key>
        </Keys>
        <input
          ref={inputRef}
          type="text"
          style={{
            fontSize: "0.8em",
            padding: 8,
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 6,
            border: "1px solid #CCC",
          }}
          placeholder="Search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    )
  }
)

const Keys: Container = ({ children }) => {
  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        marginRight: "0.3em",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      }}
    >
      {children}
    </div>
  )
}
const Key: Container = ({ children }) => {
  return (
    <div
      style={{
        color: "#888",
        borderRadius: 6,
        fontSize: "0.6em",
        padding: "0.5em",
        minWidth: "1.5em",
        textAlign: "center",
        border: "1px solid #CCC",
      }}
    >
      {children}
    </div>
  )
}

export const Link = _Link

export const NavLink = ({ to, children }: LinkProps) => (
  <_Link to={to} style={{ color: "#444" }}>
    {children}
  </_Link>
)

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
      borderRight: "1px solid #EEE",
      minWidth: "128px",
      flexShrink: 0,
      padding: "20px",
    }}
  >
    {children}
  </nav>
)

export const MainColumn: Container = ({ children }) => (
  <div style={{ padding: "20px", maxWidth: "40em" }}>{children}</div>
)

export const PageHeading: Container = ({ children }) => (
  <div
    role="heading"
    aria-level={1}
    style={{ fontSize: 36, paddingBottom: "10px" }}
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
  <div role="list" style={{ marginTop: 12, marginLeft: 12, marginBottom: 12 }}>
    {children}
  </div>
)

export const NavItem: Container = ({ children }) => (
  <div role="listitem" style={{ whiteSpace: "nowrap", color: "#444" }}>
    {children}
  </div>
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

export const Code: Container = ({ children }) => <code>{children}</code>

export const Pre: Container = ({ children }) => <pre>{children}</pre>

export const Social = ({ githubUrl }: SocialProps) =>
  githubUrl ? (
    <a href={githubUrl}>
      <img src={githubLogoUrl} width={24} height={24} />
    </a>
  ) : null
