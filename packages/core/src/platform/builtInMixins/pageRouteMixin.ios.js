import { BEFORECREATE } from '../../core/innerLifecycle'
import { EventChannel } from '@mpxjs/api-proxy/src/platform/api/event-channel/index'
export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      [BEFORECREATE] () {
        const routeKey = this.__props.route.key
        const eventChannel = global.__mpxEventChannels?.[routeKey]
        const mpxEventChannel = global.__mpxEventChannel || {}
        if (eventChannel) {
          this.__eventChannel = eventChannel
          delete global.__mpxEventChannels[routeKey]
        } else if (mpxEventChannel.route === this.route && !this.wasPreloaded) {
          this.__eventChannel = mpxEventChannel.eventChannel
          delete global.__mpxEventChannel
        } else {
          this.__eventChannel = new EventChannel()
        }
      },
      methods: {
        getOpenerEventChannel () {
          return this.__eventChannel
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
