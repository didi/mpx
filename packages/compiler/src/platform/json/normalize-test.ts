import { hasOwn } from '@mpxjs/compile-utils'

export default function normalizeTest (test: string) {
  if (test) {
    return (input: Record<string, any>, meta: Record<string, any>) => {
      const pathArr = test.split('|')
      meta.paths = []
      let result = false
      for (let i = 0; i < pathArr.length; i++) {
        if (hasOwn(input, pathArr[i])) {
          meta.paths.push(pathArr[i])
          result = true
        }
      }
      return result
    }
  } else {
    return () => true
  }
}
