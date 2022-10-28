export default function isEmptyObject (obj: any) {
  if (!obj) {
    return true
  }
  for (let _ in obj) {
    return false
  }
  return true
}
