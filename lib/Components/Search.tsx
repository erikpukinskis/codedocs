import React from "react"
import { useNavigate, Link } from "react-router-dom"
import useKeyboardShortcut from "use-keyboard-shortcut"
import { useComponents } from "~/ComponentContext"
import { useDropdown } from "~/helpers/useDropdown"
import { useSearchQuery, useSearchResults, type Result } from "~/SearchContext"
import * as styles from "./Search.css"

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
              <div className={styles.emptyState}>No results</div>
            ) : (
              results.map((result, index) => (
                <Link
                  key={result.path}
                  to={result.path}
                  className={styles.searchResult({
                    isHighlighted: highlightedIndex === index,
                  })}
                  {...getOptionProps(index)}
                >
                  <div className={styles.resultTitle}>{result.title}</div>
                  <div className={styles.resultSnippet}>{result.text}</div>
                </Link>
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
