import { useSearchQuery, useSearchResults, type Result } from "@/SearchContext"
import useKeyboardShortcut from "use-keyboard-shortcut"
import { styled } from "@stitches/react"
import { useComponents } from "@/ComponentContext"
import React, { useEffect, useState, useMemo } from "react"
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
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)

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
      setHighlightedIndex(-1)
    },
    [results]
  )

  const activeDescendantId = useMemo(
    function updateActiveDescendant() {
      if (highlightedIndex === -1) return undefined
      if (!results) return undefined
      if (results.length < 1) return undefined
      return getResultId(results[highlightedIndex])
    },
    [results, highlightedIndex]
  )

  const handleKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      console.log("escape")
      setHidden(true)
      return
    }

    if (!results || results.length < 1) return

    if (
      event.key === "PageUp" ||
      (event.key === "ArrowLeft" && event.metaKey)
    ) {
      setHighlightedIndex(0)
      event.preventDefault()
    } else if (
      event.key === "PageDown" ||
      (event.key === "ArrowRight" && event.metaKey)
    ) {
      setHighlightedIndex(results.length - 1)
      event.preventDefault()
    } else if (event.key === "Enter") {
      event.preventDefault()
      const selectedResult = results[highlightedIndex]
      setHidden(true)
      blur("input")
      navigate(selectedResult.path)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (highlightedIndex < 1) return
      setHighlightedIndex((index) => index - 1)
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      if (highlightedIndex >= results.length - 1) return
      setHighlightedIndex((index) => index + 1)
    }
  }

  const handleResultClick = () => {
    setHidden(true)
    blur("input")
  }

  const isExpanded = (results: Result[] | undefined): results is Result[] => {
    return Boolean(query) && Boolean(results) && !isHidden
  }

  return (
    <Components.Popover
      target={
        <Components.SearchBox
          {...focusGroupProps}
          isExpanded={isExpanded(results)}
          value={query}
          onChange={handleQueryChange}
          onKeyPress={handleKeys}
          activeDescendantId={activeDescendantId}
          label="search docs"
        />
      }
      contents={
        isExpanded(results) ? (
          <Components.Card
            role="listbox"
            aria-label="search docs"
            pad="top-and-bottom"
            onMouseOver={() => setHighlightedIndex(-1)}
          >
            {results.length === 0 ? (
              <EmptyState>No results</EmptyState>
            ) : (
              results.map((result, index) => (
                <SearchResult
                  role="option"
                  {...focusGroupProps}
                  to={result.path}
                  onClick={handleResultClick}
                  key={result.path}
                  aria-selected={highlightedIndex === index}
                  isSelected={highlightedIndex === index}
                  id={getResultId(result)}
                >
                  <ResultTitle>{result.title}</ResultTitle>
                  <ResultSnippet>{result.text}</ResultSnippet>
                </SearchResult>
              ))
            )}
          </Components.Card>
        ) : null
      }
    />
  )
}

const getResultId = (result: Result) => {
  return result.path
    .replace(/[^\w]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/  */g, "-")
}

const EmptyState = styled("div", {
  width: "14em",
  fontSize: "0.8em",
  color: "#888",
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 16,
  paddingRight: 16,
})

const SearchResult = styled(Link, {
  "width": "14em",
  "display": "block",
  "color": "inherit",
  "paddingTop": 8,
  "paddingBottom": 8,
  "paddingLeft": 16,
  "paddingRight": 16,

  "&:hover": {
    background: "#EEE",
  },

  "variants": {
    isSelected: {
      true: {
        background: "#EEE",
      },
    },
  },
})

const ResultSnippet = styled("div", {
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

const ResultTitle = styled("div", {
  // "fontSize": "0.8em",
  // "color": "#888",

  "& mark": {
    background: "none",
    fontWeight: "bold",
  },
})
