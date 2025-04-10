// web专用mixin，在web页面上挂载route属性
export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      methods: {
        getOpenerEventChannel () {
          const eventChannel = global.__navigationHelper?.eventChannelMap[this.route]
          return eventChannel || {}
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
