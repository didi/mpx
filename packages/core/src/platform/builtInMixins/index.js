import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'
import renderHelperMixin from './renderHelperMixin'
import refsMixin from './refsMixin'
import showMixin from './showMixin'
import relationsMixin from './relationsMixin'
import i18nMixin from './i18nMixin'
import pageTitleMixin from './pageTitleMixin'
import pageScrollMixin from './pageScrollMixin'
import componentGenericsMixin from './componentGenericsMixin'
import getTabBarMixin from './getTabBarMixin'
import pageRouteMixin from './pageRouteMixin'
import runtimeModulesMixin from './runtimeModulesMixin'

export default function getBuiltInMixins (options, type) {
  let bulitInMixins = []
  if (__mpx_mode__ === 'web') {
    bulitInMixins = [
      proxyEventMixin(),
      refsMixin(),
      pageTitleMixin(type),
      pageStatusMixin(type),
      pageScrollMixin(type),
      componentGenericsMixin(type),
      getTabBarMixin(type),
      pageRouteMixin(type),
      // 由于relation可能是通过mixin注入的，不能通过当前的用户options中是否存在relations来简单判断是否注入该项mixin
      relationsMixin(type)
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
        i18nMixin(),
        runtimeModulesMixin()
      ])
    }
  }
  return bulitInMixins.filter(item => item)
}
