export default function (n: unknown): string {
  return Object.prototype.toString.call(n).slice(8, -1)
}
