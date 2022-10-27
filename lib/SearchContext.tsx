import { addSpaces } from "./helpers"
import { isHomePage, isPage, type PageOrParent } from "./tree"
import React, {
  useMemo,
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"
import MiniSearch, { type SearchResult } from "minisearch"
import en from "stopwords-json/dist/en.json"
import highlightWords, { type HighlightWords } from "highlight-words"
import { onlyText } from "react-children-utilities"

const STOP_WORDS = {
  en: new Set(en as string[]),
}

type SearchContextProperties = {
  query: string
  setQuery: (q: string) => void
  results: Result[] | undefined
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

type MiniSearchResult = SearchResult & {
  path: string
  title: string
  text: string
}

type Result = {
  path: string
  title: JSX.Element
  text: JSX.Element
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
            text: onlyText(page.doc),
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
    const miniSearch = new MiniSearch({
      fields: ["title", "text"],
      storeFields: ["path", "title", "text"],
      processTerm: (term) => (STOP_WORDS.en.has(term) ? null : term),
    })

    miniSearch.addAll(documents)

    return miniSearch
  }, [documents])

  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const results = miniSearch.search(query, {
      prefix: true,
      boost: { title: 2 },
    }) as MiniSearchResult[]

    return results.map((result) => {
      const terms = query.split(" ")

      const pattern = terms.length === 1 ? terms[0] : `(${terms.join("|")})`

      const titleChunks = highlightWords({ text: result.title, query: pattern })
      const textChunks = highlightWords({
        text: result.text,
        query: pattern,
        clipBy: 5,
      })

      return {
        path: result.path,
        title: chunksToJSX(titleChunks),
        text: chunksToJSX(textChunks),
      }
    })
  }, [query, miniSearch])

  return (
    <SearchContext.Provider value={{ query, setQuery, results }}>
      {children}
    </SearchContext.Provider>
  )
}

const chunksToJSX = (chunks: HighlightWords.Chunk[]) => (
  <>
    {chunks
      .slice(0, 4)
      .map(({ text, match }) => (match ? <mark>{text}</mark> : text))}
  </>
)
