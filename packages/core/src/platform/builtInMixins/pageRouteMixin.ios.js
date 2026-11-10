import { BEFORECREATE, ONSHOW } from '../../core/innerLifecycle'
import { EventChannel } from '@mpxjs/api-proxy/src/platform/api/event-channel/index'

function initEventChannel () {
  if (this.__eventChannel) return
  const mpxEventChannel = global.__mpxEventChannel || {}
  if (mpxEventChannel.route === this.route) {
    this.__eventChannel = mpxEventChannel.eventChannel
    delete global.__mpxEventChannel
  } else {
    this.__eventChannel = new EventChannel()
  }
}

export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      [BEFORECREATE] () {
        const props = this.__props
        if (!props.navigation.getState?.()?.preloadedRoutes?.some(route => route.key === props.route.key)) initEventChannel.call(this)
      },
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
