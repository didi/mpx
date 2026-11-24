import { BEFORECREATE, ONSHOW } from '../../core/innerLifecycle'
import { EventChannel } from '@mpxjs/api-proxy/src/platform/api/event-channel/index'
import { isPreloadedRoute } from '@mpxjs/utils'

function initEventChannel () {
  if (this._eventChannel) return
  const mpxEventChannel = global.__mpxEventChannel || {}
  if (mpxEventChannel.route === this.route) {
    this._eventChannel = mpxEventChannel.eventChannel
    delete global.__mpxEventChannel
  } else {
    this._eventChannel = new EventChannel()
  }
}

export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      [BEFORECREATE] () {
        const { navigation, route } = this.__props
        if (!isPreloadedRoute(navigation, route.key)) initEventChannel.call(this)
      },
      [ONSHOW]: initEventChannel,
      methods: {
        getOpenerEventChannel () {
          return this._eventChannel
        }
      }
    }
  }
  return {
    methods: {
      getOpenerEventChannel () {
      }
    }
  }
}
