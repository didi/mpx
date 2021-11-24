export default function mapkeys<T extends any>(
  obj: Record<string, any>,
  iteratee: (value: T, key: string) => void
): void {
  Object.keys(obj).forEach((key) => {
    iteratee(obj[key], key)
  })
}
