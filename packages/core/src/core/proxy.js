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
  preprocessRenderData,
  setByPath,
  findItem,
  asyncLock
} from '../helper/utils'
import queueWatcher from './queueWatcher'
import { watch } from './watcher'
import { getRenderCallBack } from '../platform/patch'
import {
  BEFORECREATE,
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
      console.error('【MPX ERROR】', `please specify a 【__getInitialData】function to get miniprogram's initial data`)
      return
    }
    this.uid = uid++
    this.name = options.name || ''
    this.options = options
    // initial -> created -> mounted -> destroyed
    this.state = 'initial'
    this.watchers = [] // 保存所有观察者
    this.renderReaction = null
    this.computedKeys = options.computed ? enumerableKeys(options.computed) : []
    this.localKeys = this.computedKeys.slice() // 非props key
    this.forceUpdateKeys = [] // 强制更新的key，无论是否发生change
    this.curRenderTask = null
    this.lockTask = asyncLock()
  }

  created () {
    this.initApi()
    this.initialData = this.target.__getInitialData()
    this.cacheData = extend({}, this.initialData) // 缓存数据，用于diff
    this.callUserHook(BEFORECREATE)
    this.initState(this.options)
    this.state = CREATED
    this.callUserHook(CREATED)
    // 强制走小程序原生渲染逻辑
    this.options.__nativeRender__ ? this.setData() : this.initRender()
  }

  renderTaskExecutor (isEmptyRender) {
    if ((!this.isMounted() && this.curRenderTask) || (this.isMounted() && isEmptyRender)) {
      return
    }
    let promiseResolve
    const promise = new Promise(resolve => {
      promiseResolve = resolve
    })
    this.curRenderTask = {
      promise,
      resolve: promiseResolve
    }
    // isMounted之前基于mounted触发，isMounted之后基于setData回调触发
    return this.isMounted() && promiseResolve
  }

  isMounted () {
    return this.state === MOUNTED
  }

  mounted () {
    if (this.state === CREATED) {
      this.state = MOUNTED
      // 用于处理refs等前置工作
      this.callUserHook(BEFOREMOUNT)
      this.callUserHook(MOUNTED)
      this.curRenderTask && this.curRenderTask.resolve()
    }
  }

  updated () {
    if (this.isMounted()) {
      this.lockTask(() => {
        // 由于异步，需要确认 this.state
        if (this.isMounted()) {
          this.callUserHook(UPDATED)
        }
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
    // 挂载混合模式下的自定义属性
    proxy(this.target, this.options, this.options.mpxCustomKeysForBlend)
    // 挂载$watch
    this.target.$watch = (...rest) => this.watch(...rest)
    // 强制执行render
    this.target.$forceUpdate = (...rest) => this.forceUpdate(...rest)
    // 监听单次回调
    this.target.$updated = fn => {
      console.warn('【MPX WARN】', '【this.$updated】 has be deprecated，please use 【this.$nextTick】 ')
      this.nextTick(fn)
    }
    this.target.$nextTick = fn => this.nextTick(fn)
  }

  initState () {
    const options = this.options
    this.initProps()
    const data = this.initData(options.data)
    const proxyData = extend({}, this.initialData, data)
    this.initComputed(options.computed, proxyData)
    this.data = observable(proxyData)
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
        console.error('【MPX ERROR】', `the computed key 【${key}】 is duplicated, please check`)
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

  nextTick (fn) {
    if (typeof fn === 'function') {
      queueWatcher(() => {
        this.curRenderTask ? this.curRenderTask.promise.then(fn) : fn()
      })
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
    const newData = filterProperties(this.data, this.localKeys)
    Object.keys(newData).forEach(key => {
      if (!this.checkInForceUpdateKeys(key) && comparer.structural(this.cacheData[key], newData[key])) {
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
        if (this.localKeys.indexOf(firstKey) > -1 && (this.checkInForceUpdateKeys(key) || diff)) {
          this.miniRenderData[key] = result[key] = clone
        }
      }
    }
    return result
  }

  doRender (data, cb) {
    if (typeof this.target.__render !== 'function') {
      console.error('【MPX ERROR】', 'please specify a 【__render】 function to render view')
      return
    }
    if (typeof cb !== 'function') {
      cb = undefined
    }

    const isEmpty = isEmptyObject(data)
    const resolve = this.renderTaskExecutor(isEmpty)
    this.forceUpdateKeys = [] // 仅用于当次的render

    // 首次渲染时向模板中注入mpxCid
    if (!this.isMounted()) {
      data = Object.assign({
        mpxCid: this.uid
      }, data)
    }

    if (isEmpty) {
      cb && cb()
      return
    }
    /**
     * mounted之后才接收回调来触发updated钩子，换言之mounted之前修改数据是不会触发updated的
     */
    let callback = cb
    if (this.isMounted()) {
      callback = () => {
        getRenderCallBack(this)()
        cb && cb()
        resolve && resolve()
      }
    }
    this.target.__render(processUndefined(data), callback)
  }

  setData (data, callback) {
    // 同步数据到proxy
    data && this.forceUpdate(data)
    if (this.options.__nativeRender__) {
      // 走原生渲染
      return this.doRender(data, callback)
    } else if (typeof callback === 'function') {
      this.nextTick(callback)
    }
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
            console.warn(`【MPX WARN】at [${this.options.mpxFileResource}]`, `Failed to execute render function, degrade to full-set-data mode!`, e)
            console.warn('【MPX WARN】', 'If the render function execution failed because of "__wxs_placeholder", ignore this warning.')
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
    let forceUpdateKeys = this.localKeys
    if (paramsType === 'Function') {
      callback = params
      params = null
    } else if (paramsType === 'Object') {
      forceUpdateKeys = Object.keys(params)
      forceUpdateKeys.forEach(key => {
        setByPath(this.data, key, params[key])
      })
    }
    this.setForceUpdateKeys(forceUpdateKeys)
    type(callback) === 'Function' && this.nextTick(callback)
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

  checkInForceUpdateKeys (key) {
    return findItem(this.forceUpdateKeys, new RegExp(`^${key}`))
  }
}
