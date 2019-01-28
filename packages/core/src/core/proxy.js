import {
  observable,
  comparer
} from 'mobx'

import {
  enumerable,
  filterProperties,
  type,
  enumerableKeys,
  extend,
  proxy,
  isEmptyObject,
  processUndefined,
  diffAndCloneA,
  defineGetter,
  isValidIdentifierStr,
  isNumberStr,
  preprocessRenderData
} from '../helper/utils'

import { watch } from './watcher'
import { mountedQueue } from './lifecycleQueue'
import {
  CREATED,
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
    this.state = 'initial' // initial -> created -> mounted -> destroyed
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
    mountedQueue.enter(this.depth, this.uid)
  }

  mounted () {
    if (this.state === CREATED) {
      mountedQueue.exit(this.depth, this.uid, () => {
        this.state = MOUNTED
        this.callUserHook(MOUNTED)
      })
    }
  }

  updated (fromCallback) {
    if (this.state === CREATED && fromCallback) {
      // 首次setData
      this.mounted()
    } else if (!this.updating && this.state === MOUNTED) {
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
    proxy(this, this.options.proto, enumerableKeys(this.options.proto), true)
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
    this.depth = this.data['__depth__']
    /* 计算属性在mobx里面是不可枚举的，所以篡改下 */
    enumerable(this.data, this.computedKeys)
    /* target的数据访问代理到将proxy的data */
    proxy(this.target, this.data, enumerableKeys(this.data))
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
          let match = /[^[.]*/.exec(key)
          let firstKey = match ? match[0] : key
          if (this.localKeys.indexOf(firstKey) > -1) {
            this.miniRenderData[key] = diffAndCloneA(renderData[key]).clone
          }
        }
      }
      this.doRender(this.miniRenderData)
    } else {
      this.doRender(this.processRenderData(renderData))
    }
  }

  renderWithDiffClone () {
    const data = filterProperties(this.data, this.localKeys)
    const result = diffAndCloneA(data, this.dataClone || {})
    const forceUpdateKeys = this.forceUpdateKeys
    this.dataClone = result.clone

    if (result.diff || forceUpdateKeys.length) {
      let renderData = {}
      forceUpdateKeys.forEach((key) => {
        renderData[key] = data[key]
      })
      const diffPaths = result.diffPaths
      for (let i = 0; i < diffPaths.length; i++) {
        let diffPath = diffPaths[i]
        if (diffPath.length === 0) {
          renderData = data
          break
        }

        if (forceUpdateKeys.indexOf(diffPath[0]) > -1) {
          continue
        }

        let key = ''
        let value = data
        for (let j = 0; j < diffPath.length; j++) {
          const path = diffPath[j]
          const isNumber = isNumberStr(path)
          const isValidIdentifier = isValidIdentifierStr(path)
          if (isNumber || isValidIdentifier) {
            value = value[path]
            if (isNumber) {
              key += `[${path}]`
            } else {
              if (key) {
                key += `.${path}`
              } else {
                key = path
              }
            }
          }
        }
        if (key) {
          renderData[key] = value
        }
      }
      this.doRender(renderData)
    } else {
      // 仅用于用于触发__mounted__
      this.doRender()
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
        if (this.propKeys.indexOf(firstKey) === -1 && (this.forceUpdateKeys.indexOf(firstKey) > -1 || diff)) {
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
    this.target.__render(processUndefined(data), () => this.updated(true))
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
      this.setForceUpdateKeys(params)
      extend(this.data, params)
    }
    type(callback) === 'Function' && this.onUpdated(callback)
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

  nextTick (fn) {
    return Promise.resolve().then(fn)
  }
}
