import { EventChannel } from '@mpxjs/api-proxy/src/platform/api/event-channel/index'
// web专用mixin，在web页面上挂载route属性
export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      beforeCreate () {
        this.route = this.$options.__mpxPageRoute || ''
        const mpxEventChannel = global.__mpxEventChannel || {}
        if (mpxEventChannel.route === this.route) {
          this._eventChannel = mpxEventChannel.eventChannel
        } else {
          this._eventChannel = new EventChannel()
        }
      },
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
