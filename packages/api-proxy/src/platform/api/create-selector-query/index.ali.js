import { ENV_OBJ } from '../../../common/js'
import { noop } from '@mpxjs/utils'

function createSelectorQuery (options = {}) {
  const selectorQuery = ENV_OBJ.createSelectorQuery(options)
  const proxyMethods = ['boundingClientRect', 'scrollOffset']
  const cbs = []
  proxyMethods.forEach((name) => {
    const originalMethod = selectorQuery[name]
    selectorQuery[name] = function (cb = noop) {
      cbs.push(cb)
      return originalMethod.call(this)
    }
  })

  const originalExec = selectorQuery.exec
  selectorQuery.exec = function (originalCb = noop) {
    const cb = function (results) {
      results.forEach((item, index) => {
        cbs[index] && cbs[index](item)
      })
      originalCb(results)
    }
    return originalExec.call(this, cb)
  }

  selectorQuery.in = function (_this) {
    if (typeof _this !== 'object' || typeof _this.createSelectorQuery !== 'function') {
      throw new Error('in 方法中，传入的 this 参数不是组件实例')
    }

    return _this.createSelectorQuery(options)
  }

  return selectorQuery
}

export {
  createSelectorQuery
}
