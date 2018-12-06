import pageStatusMixin from './pageStatusMixin'
import proxyEventMixin from './proxyEventMixin'

export default function getBuiltInMixins (type, options) {
  return [
    pageStatusMixin(type, options),
    proxyEventMixin(type, options)
  ].filter(item => item)
}
