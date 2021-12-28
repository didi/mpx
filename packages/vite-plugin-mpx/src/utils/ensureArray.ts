/**
 * forked from https://github.com/rollup/plugins/blob/master/packages/pluginutils/src/utils/ensureArray.ts
 * Helper since Typescript can't detect readonly arrays with Array.isArray
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isArray(arg: unknown): arg is any[] | readonly any[] {
  return Array.isArray(arg)
}

export default function ensureArray<T>(
  thing: readonly T[] | T | undefined | null
): readonly T[] {
  if (isArray(thing)) return thing
  if (thing == null) return []
  return [thing]
}
