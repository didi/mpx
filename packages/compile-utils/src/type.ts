export function type (n: any) {
  return Object.prototype.toString.call(n).slice(8, -1)
}
