import { useSearchQuery, useSearchResults } from "@/SearchContext"
import useKeyboardShortcut from "use-keyboard-shortcut"
import { styled } from "@stitches/react"
import { useComponents } from "@/ComponentContext"
import React, { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useFocusGroup } from "@/useFocusGroup"

export const Search = () => {
  const { focusGroupProps, focus, blur } = useFocusGroup({
    onBlur: () => {
      console.log("blur!")
      setHidden(true)
    },
    onFocus: () => {
      setHidden(false)
      console.log("focus!")
    },
  })

  const Components = useComponents()
  const [query, setQuery] = useSearchQuery()
  const results = useSearchResults()
  const [isHidden, setHidden] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const navigate = useNavigate()

  useKeyboardShortcut(["Meta", "K"], () => {
    focus("input")
  })

  useKeyboardShortcut(["Meta", "/"], () => {
    focus("input")
  })

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery)
    setHidden(false)
  }

  useEffect(
    function keepSelectionWithinResults() {
      if (!results) {
        setSelectedIndex(0)
      } else if (results.length === 0) {
        setSelectedIndex(0)
      } else if (selectedIndex >= results.length) {
        setSelectedIndex(results.length - 1)
      }
    },
    [results]
  )

  const handleKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      console.log("escape")
      setHidden(true)
      blur("input")
      return
    }

    if (!results || results.length < 1) return

    if (event.key === "Enter") {
      event.preventDefault()
      const selectedResult = results[selectedIndex]
      setHidden(true)
      blur("input")
      navigate(selectedResult.path)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (selectedIndex < 1) return
      setSelectedIndex((index) => index - 1)
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      if (selectedIndex >= results.length - 1) return
      setSelectedIndex((index) => index + 1)
    }
  }

  const handleResultClick = () => {
    setHidden(true)
    blur("input")
  }

  return (
    <Components.Popover
      target={
        <Components.SearchBox
          {...focusGroupProps}
          value={query}
          onChange={handleQueryChange}
          onKeyPress={handleKeys}
        />
      }
      contents={
        results && results.length > 0 && !isHidden ? (
          <Components.Card pad="top-and-bottom">
            {results.map((result, index) => {
              return (
                <StyledSearchResult
                  {...focusGroupProps}
                  to={result.path}
                  onClick={handleResultClick}
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

const StyledSearchResult = styled(Link, {
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
