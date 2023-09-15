import { walkChildren, parseSelector, error } from '@mpxjs/utils'
import { createSelectorQuery, createIntersectionObserver } from '@mpxjs/api-proxy'

export default function install (Vue) {
  Vue.prototype.triggerEvent = function (eventName, eventDetail) {
    return this.$emit(eventName, {
      type: eventName,
      detail: eventDetail
    })
  }
  Vue.prototype.selectComponent = function (selector, all) {
    const result = []
    if (/[>\s]/.test(selector)) {
      const location = this.__mpxProxy.options.mpxFileResource
      error('The selectComponent or selectAllComponents only supports the basic selector, the relation selector is not supported.', location)
    } else {
      const selectorGroups = parseSelector(selector)
      walkChildren(this, selectorGroups, this, result, all)
    }
    return all ? result : result[0]
  }
  Vue.prototype.selectAllComponents = function (selector) {
    return this.selectComponent(selector, true)
  }
  Vue.prototype.createSelectorQuery = function () {
    return createSelectorQuery().in(this)
  }
  Vue.prototype.createIntersectionObserver = function (component, options) {
    return createIntersectionObserver(component, options)
  }
}
