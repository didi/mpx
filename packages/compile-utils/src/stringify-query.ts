/**
 * stringify object to query string, started with '?'
 * @param {Object} obj
 * @param {boolean} useJSON
 * @return {string} queryString
 */
import JSON5 from 'json5'

export function stringifyQuery (obj: any, useJSON?: boolean) {
  if (useJSON) return `?${JSON5.stringify(obj)}`

  const res = obj
    ? Object.keys(obj)
      .sort()
      .map(key => {
        const val = obj[key]

        if (val === undefined) {
          return val
        }

        if (val === true) {
          return key
        }

        if (Array.isArray(val)) {

          const key2 = `${key}[]`
          const result: string[] = []
          val.slice().forEach(val2 => {
            if (val2 === undefined) {
              return
            }
            result.push(`${key2}=${encodeURIComponent(val2)}`)
          })
          return result.join('&')
        }
        return `${key}=${encodeURIComponent(val)}`
      })
      .filter(x => x)
      .join('&')
    : null
  return res ? `?${res}` : ''
}
