import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'
import renderHelperMixin from './renderHelperMixin'
import injectHelperMixin from './injectHelperMixin'

export default function getBuiltInMixins (type, options) {
  return [
    pageStatusMixin(type, options),
    proxyEventMixin(type, options),
    renderHelperMixin(),
    injectHelperMixin()
  ].filter(item => item)
}
