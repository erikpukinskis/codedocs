import prettier from "prettier"
import parserTypescript from "prettier/parser-typescript"

export function formatTypescript(source: string): string {
  try {
    let sourceToFormat = source
    let wrappedInFragment = false

    const hasMultipleRoots = /<\/\w+>\s*<\w+/.test(source)

    if (hasMultipleRoots) {
      sourceToFormat = `<>${source}</>`
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
