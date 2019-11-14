/// <reference path="./@types/index.d.ts" />

import * as allApi from './api'
import { EventChannel } from './api/event-channel'

export default function install (target: any) {
  window.EventChannel = new EventChannel()

  Object.keys(allApi).forEach(api => {
    target[api] = function (...args) {
      return allApi[api].apply(this, args)
    }
  })
}
