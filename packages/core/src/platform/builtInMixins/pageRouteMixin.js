// web专用mixin，在web页面上挂载route属性
export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      beforeCreate () {
        if (this.$options.__mpxPageRoute) {
          this.route = this.$options.__mpxPageRoute.slice(1)
        }
      }
    }
  }
}
