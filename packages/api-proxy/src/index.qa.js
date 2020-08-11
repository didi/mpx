import * as Apis from './qa'
import { genFromMap } from './common/js'

export default function install (target) {
  const fromMap = genFromMap()

  Object.keys(Apis).forEach(api => {
    target[api] = function (...args) {
      if (args.length > 0) {
        const from = args.pop()
        if (typeof from !== 'string' || !fromMap[from]) {
          args.push(from)
        }
      }

      return Apis[api].apply(target, args)
    }
  })
}
