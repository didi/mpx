import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'
import renderHelperMixin from './renderHelperMixin'
import injectHelperMixin from './injectHelperMixin'
import refsMixin from './refsMixin'
import showMixin from './showMixin'

export default function getBuiltInMixins (options, type) {
  return [
    pageStatusMixin(type),
    proxyEventMixin(),
    renderHelperMixin(),
    injectHelperMixin(),
    refsMixin(),
    showMixin(type)
  ].filter(item => item)
}
