export function isEmptyObject (obj: any) {
  if (!obj) {
    return true
  }
  for (const _ in obj) {
    return false
  }
  return true
}
