import { SelectQuery, walkChildren } from '../helper/vueUtils'
import { error } from '../helper/log'

const vuePlugin = {    
  install (Vue) {
    Vue.prototype.triggerEvent = function (eventName, eventDetail) {
      return this.$emit(eventName, {
        type: eventName,
        detail: eventDetail
      })
    }
    Vue.prototype.createSelectorQuery = function () {
      return new SelectQuery().in(this)
    }
    Vue.prototype.selectComponent = function (selector, all) {
      const result = []
      walkChildren(this, selector, this, result, all)
      if (selector.lastIndexOf('.') > 0) {
        const location = this.__mpxProxy.options.mpxFileResource
        error('The selectComponent or selectAllComponents only supports the single selector, a composed selector is not supported.', location)
      }
      return all ? result : result[0]
    }
    Vue.prototype.selectAllComponents = function (selector) {
      return this.selectComponent(selector, true)
    }
  }
}

export default vuePlugin
