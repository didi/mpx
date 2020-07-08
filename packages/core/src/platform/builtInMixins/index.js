import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'
import renderHelperMixin from './renderHelperMixin'
import refsMixin from './refsMixin'
import showMixin from './showMixin'
import relationsMixin from './relationsMixin'
import i18nMixin from './i18nMixin'
import pageTitleMixin from './pageTitleMixin'
import onPageScroll from './PageScrollMixin'

export default function getBuiltInMixins (options, type) {
  if (__mpx_mode__ === 'web') {
    return [
      proxyEventMixin(),
      refsMixin(),
      pageTitleMixin(type),
      onPageScroll(type)
    ].filter(item => item)
  } else {
    return [
      pageStatusMixin(type),
      proxyEventMixin(),
      renderHelperMixin(),
      refsMixin(),
      showMixin(type),
      relationsMixin(type),
      i18nMixin()
    ].filter(item => item)
  }
}
