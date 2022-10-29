import { useSearchQuery, useSearchResults } from "@/SearchContext"
import useKeyboardShortcut from "use-keyboard-shortcut"
import { styled } from "@stitches/react"
import { useComponents } from "@/ComponentContext"
import React, { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

export const Search = () => {
  const Components = useComponents()
  const [query, setQuery] = useSearchQuery()
  const results = useSearchResults()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isHidden, setHidden] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const navigate = useNavigate()

  useKeyboardShortcut(["Meta", "Shift", "F"], () => {
    inputRef.current?.focus()
  })

  console.log({ isHidden })

  const handleKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results || results.length < 1) return

    if (event.key === "Enter") {
      event.preventDefault()
      const selectedResult = results[selectedIndex]
      setHidden(true)
      navigate(`/${selectedResult.path}`)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (selectedIndex < 0) return
      setSelectedIndex((index) => index - 1)
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      if (selectedIndex >= results.length - 1) return
      setSelectedIndex((index) => index + 1)
    }
  }

  return (
    <Components.Popover
      target={
        <Components.SearchBox
          ref={inputRef}
          value={query}
          onChange={setQuery}
          onFocus={() => setHidden(false)}
          onBlur={() => setHidden(true)}
          onKeyPress={handleKeys}
        />
      }
      contents={
        results && results.length > 0 && !isHidden ? (
          <Components.Card padding="top-and-bottom">
            {results.map((result, index) => {
              return (
                <StyledSearchResult
                  href={`/${result.path}`}
                  key={result.path}
                  isSelected={selectedIndex === index}
                >
                  <StyledResultTitle>{result.title}</StyledResultTitle>
                  <StyledResultSnippet>{result.text}</StyledResultSnippet>
                </StyledSearchResult>
              )
            })}
          </Components.Card>
        ) : null
      }
    />
  )
}

const StyledSearchResult = styled("a", {
  width: "14em",
  display: "block",
  color: "inherit",
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 16,
  paddingRight: 16,

  variants: {
    isSelected: {
      true: {
        background: "#EEE",
      },
    },
  },
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
