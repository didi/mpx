import { hasOwn } from './has-own'
const stringify = JSON.stringify.bind(JSON)

export { stringify }

export function stringifyObject (
  obj?: Record<string, unknown>
): Record<string, string> {
  const result: Record<string, string> = {}
  if (obj) {
    Object.keys(obj).forEach(key => {
      result[key] = stringify(obj[key])
    })
  }
  return result
}

export function shallowStringify (obj: Record<string, string>): string {
  const arr = []
  for (const key in obj) {
    if (hasOwn(obj, key)) {
      let value = obj[key]
      if (Array.isArray(value)) {
        value = `[${value.join(',')}]`
      }
      arr.push(`'${key}':${value}`)
    }
  }
  return `{${arr.join(',')}}`
}
