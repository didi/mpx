import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'
import renderHelperMixin from './renderHelperMixin'
import refsMixin from './refsMixin'
import showMixin from './showMixin'
import relationsMixin from './relationsMixin'
import i18nMixin from './i18nMixin'
import pageTitleMixin from './pageTitleMixin'
// import pageScrollMixin from './pageScrollMixin'
import pageResizeMixin from './pageResizeMixin'
import componentGenericsMixin from './componentGenericsMixin'
import getTabBarMixin from './getTabBarMixin'
import pageRouteMixin from './pageRouteMixin'

export default function getBuiltInMixins (options, type) {
  let bulitInMixins = []
  if (__mpx_mode__ === 'web') {
    bulitInMixins = [
      proxyEventMixin(),
      refsMixin(),
      pageTitleMixin(type),
      pageStatusMixin(type),
      // 使用bs进行pageScroll限制太多，暂时先移除
      // pageScrollMixin(type),
      pageResizeMixin(type),
      componentGenericsMixin(type),
      getTabBarMixin(type),
      pageRouteMixin(type)
    ]
  } else {
    // 此为差异抹平类mixins，原生模式下也需要注入也抹平平台差异
    bulitInMixins = [
      proxyEventMixin(),
      pageStatusMixin(type),
      refsMixin(),
      relationsMixin(type)
    ]
    // 此为纯增强类mixins，原生模式下不需要注入
    if (!options.__nativeRender__) {
      bulitInMixins = bulitInMixins.concat([
        renderHelperMixin(),
        showMixin(type),
        i18nMixin()
      ])
    }
  }
  return bulitInMixins.filter(item => item)
}
