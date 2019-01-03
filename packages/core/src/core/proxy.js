import {
  observable,
  computed,
  toJS,
  extras
} from 'mobx'

import {
  enumerable,
  deleteProperties,
  type,
  enumerableKeys,
  extend,
  proxy,
  isEmptyObject,
  processUndefined,
  diffAndCloneA
} from '../helper/utils'

import {watch} from './watcher'

export default class MPXProxy {
  constructor (options, target, deepDiff) {
    this.target = target
    if (typeof target.__getInitialData !== 'function') {
      console.error(`please specify a 【__getInitialData】function to get miniprogram's initial data`)
      return
    }
    this.initialData = target.__getInitialData()
    this.watchers = [] // 保存所有观察者
    this.renderReaction = null
    this.updatedCallbacks = [] // 保存设置的更新回调
    this.computedKeys = options.computed ? enumerableKeys(options.computed) : []
    this.propKeys = enumerableKeys(options.properties || options.props || {})
    this.forceUpdateKeys = [] // 强制更新的key，无论是否发生change
    this.deepDiff = options.deepDiff || deepDiff
    // 需要强制diff的属性数组
    if (this.deepDiff) {
      this.forceDiffKeys = enumerableKeys(this.initialData).concat(this.computedKeys)
    } else if (type(options.forceDiffKeys) === 'Array') {
      this.forceDiffKeys = options.forceDiffKeys
    } else if (options.forceDiffKeys) {
      console.warn('[forceDiffKeys] must be Array of key')
    }
    this.cacheData = this.initialData // 缓存数据，用于diff
    this.init(options)
  }

  init (options) {
    // 初始化computed
    const computed = this.initComputed(options.computed)
    const initialData = this.initialData
    this.data = observable(extend({}, initialData, computed))
    /* 计算属性在mobx里面是不可枚举的，所以篡改下 */
    enumerable(this.data, this.computedKeys)
    /* target的数据访问代理到将proxy的data */
    proxy(this.target, this.data, enumerableKeys(this.data))
    // 初始化watch
    this.initWatch(options.watch)
  }

  initComputed (computedConfig) {
    const newComputed = {}
    this.computedKeys.forEach(key => {
      newComputed[key] = computed(computedConfig[key], { context: this.target })
    })
    return newComputed
  }

  initWatch (watches) {
    if (type(watches) === 'Object') {
      enumerableKeys(watches).forEach(key => {
        const handler = watches[key]
        if (type(handler) === 'Array') {
          handler.forEach(item => {
            this.watch(key, item)
          })
        } else {
          this.watch(key, handler)
        }
      })
    }
  }

  updated (fn) {
    this.updatedCallbacks.push(fn)
  }

  handleUpdatedCallbacks () {
    const pendingList = this.updatedCallbacks.slice(0)
    this.updatedCallbacks.length = 0
    let callback = pendingList.shift()
    while (callback) {
      typeof callback === 'function' && callback.apply(this.target)
      callback = pendingList.shift()
    }
  }

  watch (expr, handler = {}) {
    const watcher = watch(this.target, expr, handler)
    this.watchers.push(watcher)
    return this.removeWatch(watcher)
  }

  removeWatch (watcher) {
    return () => {
      const watchers = this.watchers
      if (watcher) {
        const index = watchers.indexOf(watcher)
        index > -1 && watchers.splice(index, 1)
        watcher.destroy()
      } else {
        watcher = watchers.shift()
        while (watcher) {
          watcher.destroy()
          watcher = watchers.shift()
        }
      }
    }
  }

  clearWatchers () {
    this.renderReaction = null
    this.removeWatch()()
  }

  render () {
    if (typeof this.target.__render !== 'function') {
      console.error('please specify a 【__render】 function to render view')
      return
    }
    const ignoreKeys = this.propKeys.slice()
    const forceUpdateKeys = this.forceUpdateKeys
    if (this.forceDiffKeys) {
      this.forceDiffKeys.forEach(key => {
        const isForceUpdateKey = forceUpdateKeys.indexOf(key) > -1
        /**
         * 微信小程序能利用setData的同步性质来track依赖，因此属于forceUpdateKey时，可以不进行diff
         * 支付宝小程序setData是异步的，所以需要主动遍历所有属性进行track
         */
        if (ignoreKeys.indexOf(key) === -1 && (this.deepDiff || !isForceUpdateKey)) {
          if (extras.deepEqual(this.cacheData[key], this.data[key])) {
            // 强制更新的key，无论是否变化，都要进行最终的setData
            !isForceUpdateKey && ignoreKeys.push(key)
          } else {
            this.cacheData[key] = toJS(this.data[key])
          }
        }
      })
    }
    this.target.__render(deleteProperties(this.data, ignoreKeys), () => this.handleUpdatedCallbacks())
    this.forceUpdateKeys = [] // 仅用于当次的render
  }

  renderWithData () {
    if (typeof this.target.__getRenderData !== 'function') {
      return this.render()
    }
    let renderData = this.target.__getRenderData.call(this.data)
    if (!this.miniRenderData) {
      this.miniRenderData = {}
      this.firstKeyMap = {}
      let ignoreKeys = this.propKeys.slice()
      for (let key in renderData) {
        if (renderData.hasOwnProperty(key)) {
          let match = /[^[.]*/.exec(key)
          let firstKey = match ? match[0] : key
          if (ignoreKeys.indexOf(firstKey) === -1) {
            this.miniRenderData[key] = diffAndCloneA(renderData[key]).clone
          }
          this.firstKeyMap[key] = firstKey
        }
      }
      this.doRender(this.miniRenderData)
    } else {
      this.doRender(this.processRenderData(renderData))
    }
  }

  processRenderData (data) {
    let result = {}
    for (let key in this.miniRenderData) {
      if (this.miniRenderData.hasOwnProperty(key)) {
        let { clone, diff } = diffAndCloneA(data[key], this.miniRenderData[key])
        if (this.forceUpdateKeys.indexOf(this.firstKeyMap[key]) > -1 || diff) {
          this.miniRenderData[key] = result[key] = clone
        }
      }
    }
    this.forceUpdateKeys = []
    return result
  }

  doRender (data) {
    if (isEmptyObject(data)) {
      return
    }
    this.target.__render(processUndefined(data), () => this.handleUpdatedCallbacks())
  }

  watchRender () {
    let renderWatcher
    if (this.target.__injectedRender) {
      renderWatcher = watch(this.target, this.target.__injectedRender, {
        handler: () => {
          this.renderWithData()
        },
        immediate: true,
        forceCallback: true
      })
    } else {
      renderWatcher = watch(this.target, () => {
        this.render()
      })
    }
    this.renderReaction = renderWatcher.reaction
    this.watchers.push(renderWatcher)
  }

  forceUpdate (params, callback) {
    const paramsType = type(params)
    if (paramsType === 'Function') {
      callback = params
      params = null
    } else if (paramsType === 'Object') {
      this.setForceUpdateKeys(params)
      extend(this.data, params)
    }
    type(callback) === 'Function' && this.updated(callback)
    // 无论是否改变，强制将状态置为stale，从而触发render
    if (this.renderReaction) {
      this.renderReaction.dependenciesState = 2
      this.renderReaction.schedule()
    }
  }

  setForceUpdateKeys (obj) {
    Object.keys(obj).forEach(key => {
      if (this.forceUpdateKeys.indexOf(key) === -1) {
        this.forceUpdateKeys.push(key)
      }
    })
  }
}
