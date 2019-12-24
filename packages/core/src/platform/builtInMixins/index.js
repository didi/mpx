import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'
import renderHelperMixin from './renderHelperMixin'
import refsMixin from './refsMixin'
import showMixin from './showMixin'
import relationsMixin from './relationsMixin'

export default function getBuiltInMixins (options, type) {
  if (__mpx_mode__ === 'web') {
    return [
      proxyEventMixin(),
      refsMixin()
    ]
  } else {
    return [
      pageStatusMixin(type),
      proxyEventMixin(),
      renderHelperMixin(),
      refsMixin(),
      showMixin(type),
      relationsMixin(type)
    ].filter(item => item)
  }
}
