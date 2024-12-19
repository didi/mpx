import { walkChildren, parseSelector, error, hasOwn, collectDataset } from '@mpxjs/utils'
import { createSelectorQuery, createIntersectionObserver } from '@mpxjs/api-proxy'
import { EffectScope } from 'vue'
import { PausedState } from '../../helper/const'

const hackEffectScope = () => {
  EffectScope.prototype.pause = function () {
    if (this.active) {
      let i, l
      for (i = 0, l = this.effects.length; i < l; i++) {
        const effect = this.effects[i]
        // vue2.7中存在对于watcher实例方法的重写(doWatch)，因此无法通过修改Watcher.prototype统一实现pause和resume，只能逐个实例修改实现
        if (!hasOwn(effect, 'pausedState')) {
          effect.pausedState = PausedState.resumed
          const rawUpdate = effect.update
          effect.update = function () {
            if (effect.pausedState !== PausedState.resumed) {
              effect.pausedState = PausedState.dirty
            } else {
              rawUpdate.call(effect)
            }
          }
        }
        if (effect.pausedState !== PausedState.dirty) {
          effect.pausedState = PausedState.paused
        }
      }
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].pause()
        }
      }
    }
  }

  EffectScope.prototype.resume = function (ignoreDirty = false) {
    if (this.active) {
      let i, l
      for (i = 0, l = this.effects.length; i < l; i++) {
        const effect = this.effects[i]
        if (hasOwn(effect, 'pausedState')) {
          const lastPausedState = effect.pausedState
          effect.pausedState = PausedState.resumed
          if (!ignoreDirty && lastPausedState === PausedState.dirty) {
            effect.update()
          }
        }
      }
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].resume(ignoreDirty)
        }
      }
    }
  }
}

export default function install (Vue) {
  Object.defineProperties(Vue.prototype, {
    data: {
      get () {
        return Object.assign({}, this.$props, this.$data)
      }
    },
    dataset: {
      get () {
        return collectDataset(this.$attrs, true)
      }
    },
    id: {
      get () {
        return this.$attrs.id || ''
      }
    }
  })

  Vue.prototype.__ensureString = function (val) {
    if (typeof val === 'string') {
      return val
    }
    return JSON.stringify(val) + 'MpxEscape'
  }

  Vue.prototype.triggerEvent = function (eventName, eventDetail) {
    // 输出Web时自定义组件绑定click事件会和web原生事件冲突，组件内部triggerEvent时会导致事件执行两次，将click事件改为_click来规避此问题
    const escapeEvents = ['click']
    if (escapeEvents.includes(eventName)) {
      eventName = '_' + eventName
    }
    let eventObj = {}
    const dataset = this.dataset
    const id = this.id
    const timeStamp = +new Date()
    eventObj = {
      type: eventName,
      timeStamp,
      target: { id, dataset, targetDataset: dataset },
      currentTarget: { id, dataset },
      detail: eventDetail
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
    return createSelectorQuery().in(this)
  }
  Vue.prototype.createIntersectionObserver = function (options) {
    return createIntersectionObserver(this, options)
  }
  hackEffectScope()
}
