import stringify from './stringify'

export default function stringifyObject(
  obj?: Record<string, unknown>
): Record<string, string> {
  const result: Record<string, string> = {}
  if (obj) {
    Object.keys(obj).forEach((key) => {
      result[key] = stringify(obj[key])
    })
  }
  return result
}
