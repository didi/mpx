import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'
import renderHelperMixin from './renderHelperMixin'
import injectHelperMixin from './injectHelperMixin'
import refsMixin from './refsMixin'
import lifecycleMixin from './lifecycleMixin'
import showMixin from './showMixin'

export default function getBuiltInMixins (options, type) {
  return [
    pageStatusMixin(type),
    proxyEventMixin(),
    renderHelperMixin(),
    injectHelperMixin(),
    refsMixin(),
    lifecycleMixin(type),
    showMixin(type)
  ].filter(item => item)
}
