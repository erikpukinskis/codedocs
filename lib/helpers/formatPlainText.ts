/**
 * Remove the longest common leading whitespace from each line (ignoring
 * whitespace-only lines when computing the margin), then trim the block.
 */
export function dedentText(text: string): string {
  const lines = text.split(/\r?\n/)
  let minIndent = Infinity
  for (const line of lines) {
    if (line.trim() === "") continue
    const m = line.match(/^\s*/)
    const leading = m?.[0].length ?? 0
    minIndent = Math.min(minIndent, leading)
  }
  if (minIndent === Infinity || minIndent === 0) {
    return text.trim()
  }
  const dedented = lines
    .map((line) => (line.trim() === "" ? "" : line.slice(minIndent)))
    .join("\n")
  return dedented.trim()
}

/**
 * Normalize non-TS code blocks (e.g. bash inside an indented template literal):
 * strip leading / trailing blank lines, then dedent.
 */
export function formatPlainTextCodeBlock(source: string): string {
  source = source.replace(/^(\s*\n)*/, "")
  source = source.replace(/(\n\s*)$/, "")
  return dedentText(source)
}
