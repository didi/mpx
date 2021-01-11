import * as allApi from './web/api'
import { EventChannel } from './web/api/event-channel'
import { genFromMap } from './common/js'

export default function install (target) {
  const fromMap = genFromMap()

  global.EventChannel = EventChannel

  Object.keys(allApi).forEach(api => {
    target[api] = function (...args) {
      if (args.length > 0) {
        const from = args.pop()
        if (typeof from !== 'string' || !fromMap[from]) {
          args.push(from)
        }
      }

      return allApi[api].apply(target, args)
    }
  })
}
export function getMpxApiProxy () {
  let apiProxy = {}
  install(apiProxy)
  return apiProxy
}
