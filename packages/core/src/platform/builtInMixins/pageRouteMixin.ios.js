import { BEFORECREATE } from '../../core/innerLifecycle'
import { EventChannel } from '@mpxjs/api-proxy/src/platform/api/event-channel/index'
export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      [BEFORECREATE] () {
        const mpxEventChannel = global.__mpxEventChannel || {}
        if (mpxEventChannel.route === this.route) {
          this.__eventChannel = mpxEventChannel.eventChannel
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
