// web专用mixin，在web页面上挂载route属性
export default function pageRouteMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      beforeCreate () {
        this.route = this.$options.__mpxPageRoute || ''
      }
    }
  }
}
