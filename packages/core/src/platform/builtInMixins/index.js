import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'
import componentMixin from './componentMixin'
import renderHelperMixin from './renderHelperMixin'
import injectHelperMixin from './injectHelperMixin'

export default function getBuiltInMixins (type, options) {
  return [
    pageStatusMixin(type, options),
    proxyEventMixin(type, options),
    componentMixin(type, options),
    renderHelperMixin(),
    injectHelperMixin()
  ].filter(item => item)
}
