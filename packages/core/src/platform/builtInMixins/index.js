import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'
import renderHelperMixin from './renderHelperMixin'
import injectHelperMixin from './injectHelperMixin'
import refsMixin from './refsMixin'

export default function getBuiltInMixins (options, type) {
  return [
    pageStatusMixin(type),
    proxyEventMixin(),
    renderHelperMixin(),
    injectHelperMixin(),
    refsMixin()
  ].filter(item => item)
}
