// web专用mixin，在web页面上挂载route属性
export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      beforeCreate () {
        this.route = this.$options.__mpxPageRoute || ''
      },
      computed: {
        _eventChannel () {
          const mpxEventChannel = global.__mpxEventChannel || {}
          if (mpxEventChannel.route === this.route) {
            return mpxEventChannel.eventChannel
          }
          return {}
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
