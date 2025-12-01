import { styled } from "@stitches/react"
import React from "react"
import { useNavigate, Link } from "react-router-dom"
import useKeyboardShortcut from "use-keyboard-shortcut"
import { useComponents } from "~/ComponentContext"
import { useDropdown } from "~/helpers/useDropdown"
import { useSearchQuery, useSearchResults, type Result } from "~/SearchContext"

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
  width: "14em",
  display: "block",
  color: "inherit",
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 16,
  paddingRight: 16,

  "&:hover": {
    background: "#eee",
  },

  variants: {
    isHighlighted: {
      true: {
        background: "#eee",
      },
    },
  },
})

const ResultSnippet = styled("div", {
  fontSize: "0.8em",
  color: "#888",
  maxHeight: "2.6em",
  overflow: "hidden",

  "& mark": {
    background: "#eeffc6",
    color: "#3a7174",
    fontWeight: "bold",
  },
})

const ResultTitle = styled("div", {
  "& mark": {
    background: "#eeffc6",
    color: "#3a7174",
    fontWeight: "bold",
  },
})

export const Search = () => {
  const Components = useComponents()
  const [, setQuery] = useSearchQuery()
  const results = useSearchResults()
  const navigate = useNavigate()

  const {
    getInputProps,
    getListboxProps,
    getOptionProps,
    focus,
    clear,
    isExpanded,
    highlightedIndex,
  } = useDropdown(results, {
    label: "search docs",
    onInputChange: setQuery,
    getOptionId: getResultId,
    onSelect: (result) => {
      navigate(result.path)
    },
  })

  useKeyboardShortcut(["Meta", "K"], () => {
    focus()
  })

  useKeyboardShortcut(["Meta", "/"], () => {
    focus()
  })

  return (
    <Components.Popover
      target={
        <Components.SearchBox
          inputProps={getInputProps()}
          onClickClear={clear}
        />
      }
      contents={
        isExpanded && results ? (
          <Components.Card {...getListboxProps()} pad="top-and-bottom">
            {results.length === 0 ? (
              <EmptyState>No results</EmptyState>
            ) : (
              results.map((result, index) => (
                <SearchResult
                  key={result.path}
                  to={result.path}
                  isHighlighted={highlightedIndex === index}
                  {...getOptionProps(index)}
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
