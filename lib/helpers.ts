export const getPathSegments = (path: string) => {
  return path.split("/").filter((segment) => Boolean(segment))
}

export const nameFromPath = (path: string) => {
  const segments = getPathSegments(path)
  return segments[segments.length - 1]
}

export const addSpaces = (name: string) => {
  if (name.startsWith("_")) return name.replace("_", "")
  else return name.replace(/(.)([A-Z])/g, "$1 $2")
}

export const isElement = (target: EventTarget): target is HTMLElement => {
  return target instanceof HTMLElement
}
