export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
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
          return this._eventChannel || {}
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
