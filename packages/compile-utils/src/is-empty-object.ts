export function isEmptyObject (obj: any) {
  if (!obj) {
    return true
  }
  // @ts-ignore
  for (const key in obj) {
    return false
  }
  return true
}
