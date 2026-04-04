import prettier from "prettier"
import parserTypescript from "prettier/parser-typescript"

export function formatTypescript(source: string): string {
  try {
    let sourceToFormat = source.trim()
    let wrappedInFragment = false

    // Only wrap in fragment if the code starts with JSX (indicating it's a JSX-only snippet)
    // Don't wrap if it has imports, exports, or other statements
    const startsWithJSX = /^\s*</.test(sourceToFormat)
    const hasMultipleRoots = startsWithJSX && /<\/\w+>\s*<\w+/.test(sourceToFormat)

    if (hasMultipleRoots) {
      sourceToFormat = `<>${sourceToFormat}</>`
      wrappedInFragment = true
    }

    const formatted = prettier
      .format(sourceToFormat, {
        parser: "typescript",
        plugins: [parserTypescript],
        printWidth: 55,
        semi: false,
      })
      .replace(/^;/, "")
      .trim()

    if (wrappedInFragment) {
      return formatted.slice(2, -3).trim()
    }

    return formatted
  } catch {
    return source
  }
}
