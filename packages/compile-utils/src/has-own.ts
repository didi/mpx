const hasOwnProperty = Object.prototype.hasOwnProperty

export function hasOwn (obj: Record<string, any>, key: string) {
  return hasOwnProperty.call(obj, key)
}
