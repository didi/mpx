import * as allApi from './web/api'
import { EventChannel } from './web/api/event-channel'

export default function install (target) {
  window.EventChannel = new EventChannel()

  Object.keys(allApi).forEach(api => {
    target[api] = function (...args) {
      return allApi[api].apply(this, args)
    }
  })
}
