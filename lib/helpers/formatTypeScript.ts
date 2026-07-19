import { format } from "@prettier/sync"
import { formatPlainTextCodeBlock } from "./formatPlainText"

export function formatTypescript(source: string): string {
  try {
    let sourceToFormat = source.trim()
    let wrappedInFragment = false

    // Only wrap in fragment if the code starts with JSX (indicating it's a JSX-only snippet)
    // Don't wrap if it has imports, exports, or other statements
    const startsWithJSX = /^\s*</.test(sourceToFormat)
    const hasMultipleRoots =
      startsWithJSX && /<\/\w+>\s*<\w+/.test(sourceToFormat)

    if (hasMultipleRoots) {
      sourceToFormat = `<>${sourceToFormat}</>`
      wrappedInFragment = true
    }

    const formatted = format(sourceToFormat, {
      parser: "typescript",
      printWidth: 55,
      semi: false,
    })

    const trimmed = formatted.replace(/^;/, "").trim()

    if (wrappedInFragment) {
      return trimmed.slice(2, -3).trim()
    }

    return trimmed
  } catch {
    return formatPlainTextCodeBlock(source)
  }
}
