export function isEmptyObject (obj: any) {
  if (!obj) {
    return true
  }
  // @ts-ignore
  // eslint-disable-next-line no-unreachable-loop
  for (const key in obj) {
    return false
  }
  return true
}
