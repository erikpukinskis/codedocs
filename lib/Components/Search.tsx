import { useSearchQuery, useSearchResults } from "@/SearchContext"
import useKeyboardShortcut from "use-keyboard-shortcut"
import { styled } from "@stitches/react"
import { useComponents } from "@/ComponentContext"
import React, { useRef } from "react"

export const Search = () => {
  const Components = useComponents()
  const [query, setQuery] = useSearchQuery()
  const results = useSearchResults()
  const inputRef = useRef<HTMLInputElement>(null)

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
          <Components.Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {results?.map((result) => {
                return (
                  <StyledSearchResult
                    href={`/${result.path}`}
                    key={result.path}
                  >
                    <StyledResultTitle>{result.title}</StyledResultTitle>
                    <StyledResultSnippet>{result.text}</StyledResultSnippet>
                  </StyledSearchResult>
                )
              })}
            </div>
          </Components.Card>
        ) : null
      }
    />
  )
}

const StyledSearchResult = styled("a", {
  display: "block",
  color: "inherit",
})

const StyledResultSnippet = styled("div", {
  "fontSize": "0.8em",
  "color": "#888",
  "maxHeight": "2.6em",
  "overflow": "hidden",

  "& mark": {
    background: "none",
    fontWeight: "bold",
    color: "#666",
  },
})

const StyledResultTitle = styled("div", {
  // "fontSize": "0.8em",
  // "color": "#888",

  "& mark": {
    background: "none",
    fontWeight: "bold",
  },
})
