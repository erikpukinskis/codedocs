import { addSpaces } from "./helpers"
import { isHomePage, isPage, type PageOrParent } from "./tree"
import getInnerText from "react-innertext"
import React, {
  useMemo,
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"
import MiniSearch, { type SearchResult } from "minisearch"

type SearchContextProperties = {
  query: string
  setQuery: (q: string) => void
  results: SearchIndexResult[] | undefined
}

const SearchContext = createContext({} as SearchContextProperties)

export const useSearchQuery = (): [string, (q: string) => void] => {
  const { query, setQuery } = useContext(SearchContext)
  if (!setQuery) {
    throw new Error(
      "Cannot use useSearchQuery outside of a SearchContextProvider"
    )
  }

  return [query, setQuery]
}

export const useSearchResults = () => {
  const { results } = useContext(SearchContext)
  console.log(results)
  return results
}

type SearchIndexItem = {
  id: string
  path: string
  title: string
  text: string
}

type SearchIndexResult = SearchResult & {
  path: string
  title: string
}

type SearchContextProviderProps = {
  pagesByPath: Record<string, PageOrParent>
  children: ReactNode
}

export const SearchContextProvider = ({
  pagesByPath,
  children,
}: SearchContextProviderProps) => {
  const documents = useMemo(
    function getDocuments() {
      const documents: SearchIndexItem[] = []

      for (const pageOrParent of Object.values(pagesByPath)) {
        if (isPage(pageOrParent) || isHomePage(pageOrParent)) {
          const page = pageOrParent
          documents.push({
            id: page.path,
            path: page.path,
            title: isHomePage(page) ? "Home Page" : addSpaces(page.name),
            text: getInnerText(page.doc),
          })
        } else {
          const parent = pageOrParent
          documents.push({
            id: parent.path,
            path: parent.path,
            title: addSpaces(parent.name),
            text: "",
          })
        }
      }

      return documents
    },
    [pagesByPath]
  )

  const miniSearch = useMemo(() => {
    console.log({ documents })
    const miniSearch = new MiniSearch({
      fields: ["title", "text"],
      storeFields: ["path", "title"],
    })

    miniSearch.addAll(documents)

    return miniSearch
  }, [documents])

  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    return miniSearch.search(query) as SearchIndexResult[]
  }, [query, miniSearch])

  return (
    <SearchContext.Provider value={{ query, setQuery, results }}>
      {children}
    </SearchContext.Provider>
  )
}
