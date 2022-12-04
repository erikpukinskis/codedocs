import { useState, useEffect, useMemo } from "react"
import { useFocusGroup } from "~/useFocusGroup"

type DropdownOptions<ItemType> = {
  label: string
  onInputChange?: (value: string) => void
  getOptionId: (item: ItemType) => string
  onSelect?: (item: ItemType) => void
}

export const useDropdown = <ItemType>(
  items: ItemType[] | undefined,
  { label, onInputChange, getOptionId, onSelect }: DropdownOptions<ItemType>
) => {
  const [isHidden, setHidden] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [query, setQuery] = useState("")

  const { focusGroupProps, focus, blur } = useFocusGroup({
    onBlur: () => setHidden(true),
  })

  useEffect(
    function keepSelectionWithinResults() {
      setHighlightedIndex(-1)
    },
    [items]
  )

  const activeDescendantId = useMemo(
    function updateActiveDescendant() {
      if (highlightedIndex === -1) return undefined
      if (!items) return undefined
      if (items.length < 1) return undefined
      return getOptionId(items[highlightedIndex])
    },
    [items, highlightedIndex]
  )

  const handleKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      console.log("escape")
      setHidden(true)
      return
    }

    if (!items || items.length < 1) return

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
      setHighlightedIndex(items.length - 1)
      event.preventDefault()
    } else if (event.key === "Enter") {
      event.preventDefault()
      const selectedItem = items[highlightedIndex]
      setHidden(true)
      blur("input")
      onSelect?.(selectedItem)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (highlightedIndex < 1) return
      setHighlightedIndex((index) => index - 1)
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      if (highlightedIndex >= items.length - 1) return
      setHighlightedIndex((index) => index + 1)
    }
  }

  const handleInputChange = (event: React.ChangeEvent) => {
    if (!(event.target instanceof HTMLInputElement)) {
      throw new Error(
        "useDropdown input change target was not an HTMLInputElement?"
      )
    }
    setQuery(event.target.value)
    onInputChange?.(event.target.value)
    setHidden(false)
  }

  const handleResultClick = () => {
    setHidden(true)
    blur("input")
  }

  const isExpanded = (items: ItemType[] | undefined): items is ItemType[] => {
    return Boolean(query) && Boolean(items) && !isHidden
  }

  return {
    highlightedIndex,
    isExpanded: isExpanded(items),
    getInputProps: () => ({
      ...focusGroupProps,
      "onChange": handleInputChange,
      "role": "combobox",
      "aria-expanded": isExpanded(items),
      "aria-activedescendant": activeDescendantId,
      "aria-label": label,
      "value": query,
      "onKeyDown": handleKeys,
    }),
    getListboxProps: () => ({
      "role": "listbox",
      "aria-label": label,
      "onMouseOver": () => setHighlightedIndex(-1),
    }),
    getOptionProps: (index: number) => ({
      "role": "option",
      ...focusGroupProps,
      "onClick": handleResultClick,
      "aria-selected": highlightedIndex === index,
      "id": items ? getOptionId(items[index]) : undefined,
    }),
    focus: () => {
      focus("input")
    },
    clear: () => {
      setQuery("")
      focus("input")
    },
  }
}
