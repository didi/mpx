import { BEFORECREATE, ONSHOW } from '../../core/innerLifecycle'
import { EventChannel } from '@mpxjs/api-proxy/src/platform/api/event-channel/index'

function initEventChannel () {
  const mpxEventChannel = global.__mpxEventChannel || {}
  if (mpxEventChannel.route === this.route) {
    this.__eventChannel = mpxEventChannel.eventChannel
    delete global.__mpxEventChannel
  } else if (!this.__eventChannel) {
    this.__eventChannel = new EventChannel()
  }
}

export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      [BEFORECREATE]: initEventChannel,
      [ONSHOW]: initEventChannel,
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
