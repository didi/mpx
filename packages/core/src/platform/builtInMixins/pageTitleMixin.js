// web专用mixin，在web中实现页面title功能
export default function pageTitleMixin (mixinType) {
  if (mixinType === 'page' && __mpx_mode__ === 'web') {
    return {
      activated () {
        if (this.$vnode.componentOptions && this.$options.MpxPageConfig.navigationBarTitleText) {
          document.title = this.$options.__mpxPageConfig.navigationBarTitleText
        }
      }
    }
  }
}
