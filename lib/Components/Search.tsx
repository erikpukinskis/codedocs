import { useSearchQuery, useSearchResults } from "@/SearchContext"
import useKeyboardShortcut from "use-keyboard-shortcut"
import { styled } from "@stitches/react"
import { useComponents } from "@/ComponentContext"
import React, { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useFocusGroup } from "@/useFocusGroup"

export const Search = () => {
  const { focusGroupProps, focus } = useFocusGroup({
    onBlur: () => {
      console.log("blur!")
      setHidden(true)
    },
    onFocus: () => {
      console.log("focus!")
    },
  })

  const Components = useComponents()
  const [query, setQuery] = useSearchQuery()
  const results = useSearchResults()
  const [isHidden, setHidden] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const navigate = useNavigate()

  useKeyboardShortcut(["Meta", "K"], () => {
    focus("input")
  })

  useKeyboardShortcut(["Meta", "/"], () => {
    focus("input")
  })

  useEffect(() => {
    setHidden(false)
  }, [query])

  const handleKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results || results.length < 1) return

    if (event.key === "Enter") {
      event.preventDefault()
      const selectedResult = results[selectedIndex]
      setHidden(true)
      navigate(selectedResult.path)
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
          {...focusGroupProps}
          value={query}
          onChange={setQuery}
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
