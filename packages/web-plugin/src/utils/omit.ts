export default function omit<T, K extends keyof T>(
  obj: T,
  omitKeys: K[]
): Omit<T, K> {
  const result = { ...obj }
  omitKeys.forEach((key) => delete result[key])
  return result
}
