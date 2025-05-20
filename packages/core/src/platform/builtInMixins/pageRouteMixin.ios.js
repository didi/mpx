export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      __beforeCreate__ () {
        this._eventChannel = {}
        const mpxEventChannel = global.__mpxEventChannel || {}
        if (mpxEventChannel.route === this.route) {
          this._eventChannel = mpxEventChannel.eventChannel
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
