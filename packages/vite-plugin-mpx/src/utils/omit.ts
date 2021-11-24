export default function omit(
  obj: Record<string, any>,
  omitKeys: string[]
): Record<string, any> {
  const result: Record<string, any> = {}
  const uselessOptions = new Set(omitKeys)
  Object.keys(obj)
    .filter((key) => !uselessOptions.has(key))
    .forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      result[key] = jsonConfig[key]
    })
  return result
}
