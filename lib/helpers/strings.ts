export const getPathSegments = (path: string) => {
  return path.split("/").filter((segment) => Boolean(segment))
}

export const nameFromPath = (path: string) => {
  const segments = getPathSegments(path)
  return segments[segments.length - 1]
}

export const addSpaces = (name: string) => {
  return name
    .replace(/^_/, "")
    .replace(/([A-Z])/g, " $1")
    .trim()
}
