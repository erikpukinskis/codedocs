export const nameFromPath = (path: string) => path.split("/").slice(-1)[0]

export const addSpaces = (name: string) => {
  if (name.startsWith("_")) return name.replace("_", "")
  else return name.replace(/(.)([A-Z])/g, "$1 $2")
}
