export default function stringify(path: unknown): string {
  return JSON.stringify(path)
}

export function stringifyObject(
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


export function shallowStringify(obj: Record<string, unknown>): string {
  const arr = []
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key]
      if (Array.isArray(value)) {
        value = `[${value.join(',')}]`
      }
      arr.push(`'${key}':${value}`)
    }
  }
  return `{${arr.join(',')}}`
}
