import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'
import renderHelperMixin from './renderHelperMixin'
import refsMixin from './refsMixin'
import showMixin from './showMixin'
import relationsMixin from './relationsMixin'
import i18nMixin from './i18nMixin'
import pageTitleMixin from './pageTitleMixin'
import pageScrollMixin from './pageScrollMixin'

export default function getBuiltInMixins (options, type) {
  let bulitInMixins = []
  if (__mpx_mode__ === 'web') {
    bulitInMixins = [
      proxyEventMixin(),
      refsMixin(),
      pageTitleMixin(type),
      pageStatusMixin(type),
      pageScrollMixin(type)
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
