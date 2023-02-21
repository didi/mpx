const hasOwnProperty = Object.prototype.hasOwnProperty

export function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

export const isBrowser = typeof window !== 'undefined'
