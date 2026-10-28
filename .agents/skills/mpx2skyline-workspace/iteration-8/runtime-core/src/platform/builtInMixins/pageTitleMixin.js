// web专用mixin，在web中实现页面title功能
export default function pageTitleMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      activated () {
        if (this.$options.__mpxPageConfig.navigationBarTitleText) {
          document.title = this.$options.__mpxPageConfig.navigationBarTitleText
        }
      }
    }
  }
}
