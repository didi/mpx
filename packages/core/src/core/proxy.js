import {
  observable,
  comparer
} from 'mobx'

import {
  filterProperties,
  type,
  enumerableKeys,
  extend,
  proxy,
  isEmptyObject,
  processUndefined,
  diffAndCloneA,
  defineGetter,
  preprocessRenderData
} from '../helper/utils'

import { watch } from './watcher'
import { mountedQueue } from './lifecycleQueue'
import {
  CREATED,
  BEFOREMOUNT,
  MOUNTED,
  UPDATED,
  DESTROYED
} from './innerLifecycle'

let uid = 0

export default class MPXProxy {
  constructor (options, target) {
    this.target = target
    if (typeof target.__getInitialData !== 'function') {
      console.error(`please specify a 【__getInitialData】function to get miniprogram's initial data`)
      return
    }
    this.uid = uid++
    this.options = options
    // initial -> created -> [beforeMount -> mounted -> updated] -> destroyed
    this.state = 'initial'
    this.watchers = [] // 保存所有观察者
    this.renderReaction = null
    this.updatedCallbacks = [] // 保存设置的更新回调
    this.computedKeys = options.computed ? enumerableKeys(options.computed) : []
    this.localKeys = this.computedKeys.slice()
    this.forceUpdateKeys = [] // 强制更新的key，无论是否发生change
  }

  created () {
    this.initApi()
    this.initialData = this.target.__getInitialData()
    this.cacheData = extend({}, this.initialData) // 缓存数据，用于diff
    this.initState(this.options)
    this.state = CREATED
    this.callUserHook(CREATED)
    this.initRender()
  }

  beforeMount () {
    this.state = BEFOREMOUNT
    mountedQueue.enter()
  }

  mounted () {
    if (!this.mounting) {
      // 等待mounted
      this.mounting = true
      mountedQueue.exit(this.depth, this.uid, () => {
        // 由于异步，因此需要检查当前状态是否符合预期
        if (this.state === BEFOREMOUNT) {
          this.state = MOUNTED
          // 用于处理refs等前置工作
          this.callUserHook(BEFOREMOUNT)
          this.callUserHook(MOUNTED)
        }
        this.mounting = false
      })
    }
  }

  updated (fromCallback) {
    if (this.state === BEFOREMOUNT && fromCallback) {
      // 首次setData
      this.mounted()
    } else if (this.state === MOUNTED && !this.updating) {
      this.updating = true
      this.nextTick(() => {
        // 由于异步，需要确认 this.state
        if (this.state === MOUNTED) {
          this.handleUpdatedCallbacks()
          this.callUserHook(UPDATED)
        }
        this.updating = false
      })
    }
  }

  destroyed () {
    this.clearWatchers()
    this.state = DESTROYED
    this.callUserHook(DESTROYED)
  }

  initApi () {
    // 挂载扩展属性到实例上
    proxy(this.target, this.options.proto, enumerableKeys(this.options.proto), true)
    // 挂载$watch
    this.target.$watch = (...rest) => this.watch(...rest)
    // 强制执行render
    this.target.$forceUpdate = (...rest) => this.forceUpdate(...rest)
    // 监听单次回调
    this.target.$updated = (...rest) => this.onUpdated(...rest)
  }

  initState () {
    const options = this.options
    this.initProps()
    const data = this.initData(options.data)
    const proxyData = extend({}, this.initialData, data)
    this.initComputed(options.computed, proxyData)
    this.data = observable(proxyData)
    this.depth = this.data['mpxDepth']
    /* target的数据访问代理到将proxy的data */
    proxy(this.target, this.data, enumerableKeys(this.data).concat(this.computedKeys))
    // 初始化watch
    this.initWatch(options.watch)
  }

  initProps () {
    proxy(this.target, this.initialData, enumerableKeys(this.initialData))
  }

  initData (dataFn) {
    const data = typeof dataFn === 'function' ? dataFn.call(this.target) : dataFn
    this.collectLocalKeys(data)
    return data
  }

  initComputed (computedConfig, proxyData) {
    this.computedKeys.forEach(key => {
      if (key in proxyData) {
        console.error(`the computed key 【${key}】 is duplicated, please check`)
      }
      defineGetter(proxyData, key, computedConfig[key], this.target)
    })
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

  collectLocalKeys (data) {
    this.localKeys.push.apply(this.localKeys, enumerableKeys(data))
  }

  onUpdated (fn) {
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

  callUserHook (hookName) {
    const hook = this.options[hookName]
    if (typeof hook === 'function') {
      hook.call(this.target)
    }
  }

  watch (expr, handler, options) {
    const watcher = watch(this.target, expr, handler, options)
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
    const forceUpdateKeys = this.forceUpdateKeys
    const newData = filterProperties(this.data, this.localKeys)
    Object.keys(newData).forEach(key => {
      const isForceUpdateKey = forceUpdateKeys.indexOf(key) > -1
      if (!isForceUpdateKey && comparer.structural(this.cacheData[key], newData[key])) {
        // 强制更新的key，无论是否变化，都要进行最终的setData
        delete newData[key]
      } else {
        this.cacheData[key] = newData[key]
      }
    })
    this.doRender(newData)
  }

  renderWithData (rawRenderData) {
    const renderData = preprocessRenderData(rawRenderData)
    if (!this.miniRenderData) {
      this.miniRenderData = {}
      for (let key in renderData) {
        if (renderData.hasOwnProperty(key)) {
          let item = renderData[key]
          let data = item[0]
          let firstKey = item[1]
          if (this.localKeys.indexOf(firstKey) > -1) {
            this.miniRenderData[key] = diffAndCloneA(data).clone
          }
        }
      }
      this.doRender(this.miniRenderData)
    } else {
      this.doRender(this.processRenderData(renderData))
    }
  }

  processRenderData (renderData) {
    let result = {}
    for (let key in renderData) {
      if (renderData.hasOwnProperty(key)) {
        let item = renderData[key]
        let data = item[0]
        let firstKey = item[1]
        let { clone, diff } = diffAndCloneA(data, this.miniRenderData[key])
        if (this.localKeys.indexOf(firstKey) > -1 && (this.forceUpdateKeys.indexOf(firstKey) > -1 || diff)) {
          this.miniRenderData[key] = result[key] = clone
        }
      }
    }
    return result
  }

  doRender (data) {
    if (typeof this.target.__render !== 'function') {
      console.error('please specify a 【__render】 function to render view')
      return
    }
    // 空对象在state 为 CREATED 阶段也要执行，用于正常触发mounted
    if (isEmptyObject(data) && this.state !== CREATED) {
      return
    }
    if (this.state === CREATED) {
      this.beforeMount()
    }
    this.target.__render(processUndefined(data), () => {
      this.updated(true)
    })
    this.forceUpdateKeys = [] // 仅用于当次的render
  }

  initRender () {
    let renderWatcher
    let renderExecutionFailed = false
    if (this.target.__injectedRender) {
      renderWatcher = watch(this.target, () => {
        if (renderExecutionFailed) {
          this.render()
        } else {
          try {
            return this.target.__injectedRender()
          } catch (e) {
            console.warn(`Failed to execute render function, degrade to full-set-data mode!`)
            console.warn(e)
            console.warn('If the render function execution failed because of "__wxs_placeholder", ignore this warning.')
            renderExecutionFailed = true
            this.render()
          }
        }
      }, {
        handler: (ret) => {
          if (!renderExecutionFailed) {
            this.renderWithData(ret)
          }
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
      extend(this.data, params)
    }
    this.setForceUpdateKeys(params ? Object.keys(params) : this.localKeys)
    type(callback) === 'Function' && this.onUpdated(callback)
    // 无论是否改变，强制将状态置为stale，从而触发render
    if (this.renderReaction) {
      this.renderReaction.dependenciesState = 2
      this.renderReaction.schedule()
    }
  }

  setForceUpdateKeys (keys = []) {
    keys.forEach(key => {
      if (this.forceUpdateKeys.indexOf(key) === -1) {
        this.forceUpdateKeys.push(key)
      }
    })
  }

  nextTick (fn) {
    return Promise.resolve().then(fn)
  }
}
