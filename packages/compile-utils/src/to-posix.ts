export function toPosix (path: string) {
  return path.replace(/\\/g, '/')
}
