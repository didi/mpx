import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'
import renderHelperMixin from './renderHelperMixin'
import refsMixin from './refsMixin'
import showMixin from './showMixin'
import relationsMixin from './relationsMixin'
import i18nMixin from './i18nMixin'
import pageTitleMixin from './pageTitleMixin'
import onReachBottom from './reachBottomMixin'
import onPageScroll from './PageScrollMixin'
import onPullDownRefresh from './pullDownMixin'

export default function getBuiltInMixins (options, type) {
  if (__mpx_mode__ === 'web') {
    return [
      proxyEventMixin(),
      refsMixin(),
      pageTitleMixin(type),
      onReachBottom(type),
      onPageScroll(type),
      onPullDownRefresh(type)
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
