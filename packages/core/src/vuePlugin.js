import { walkChildren, parseSelector, error, hasOwn } from '@mpxjs/utils'
import * as webApi from '@mpxjs/api-proxy/src/web/api'
const datasetReg = /^data-(.+)$/

function collectDataset (attrs) {
  const dataset = {}
  for (const key in attrs) {
    if (hasOwn(attrs, key)) {
      const matched = datasetReg.exec(key)
      if (matched) {
        dataset[matched[1]] = attrs[key]
      }
    }
  }
  return dataset
}

export default function install (Vue) {
  Vue.prototype.triggerEvent = function (eventName, eventDetail, e) {
    let eventObj = {}
    if (e) {
      e.detail = Object.assign(e.detail, eventDetail)
      eventObj = e
    } else {
      const dataset = collectDataset(this.$attrs)
      const id = this.$attrs.id || ''
      const timeStamp = +new Date()
      eventObj = {
        type: eventName,
        timeStamp,
        target: { id, dataset, targetDataset: dataset },
        currentTarget: { id, dataset },
        detail: eventDetail
      }
    }
    return this.$emit(eventName, eventObj)
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
    return webApi.createSelectorQuery().in(this)
  }
  Vue.prototype.createIntersectionObserver = function (options) {
    return webApi.createIntersectionObserver(this, options)
  }
}
