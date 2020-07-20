import { observe } from '../observer/index'
import Watcher from '../observer/watcher'
import { watch } from '../observer/watch'
import { initComputed } from '../observer/computed'
import { queueWatcher } from '../observer/scheduler'
import EXPORT_MPX from '../index'
import {
  noop,
  proxy,
  isEmptyObject,
  isPlainObject,
  processUndefined,
  setByPath,
  getByPath,
  asyncLock,
  diffAndCloneA,
  preProcessRenderData,
  mergeData,
  aIsSubPathOfB,
  getFirstKey,
  makeMap
} from '../helper/utils'
import _getByPath from '../helper/getByPath'
import { getRenderCallBack } from '../platform/patch'
import {
  BEFORECREATE,
  CREATED,
  BEFOREMOUNT,
  MOUNTED,
  UPDATED,
  DESTROYED
} from './innerLifecycle'
import { warn, error } from '../helper/log'

let uid = 0

export default class MPXProxy {
  constructor (options, target) {
    this.target = target
    this.uid = uid++
    this.name = options.name || ''
    this.options = options
    // initial -> created -> mounted -> destroyed
    this.state = 'initial'
    this.lockTask = asyncLock()
    this.ignoreProxyMap = makeMap(EXPORT_MPX.config.ignoreProxyWhiteList)
    if (__mpx_mode__ !== 'web') {
      if (typeof target.__getInitialData !== 'function') {
        error('Please specify a [__getInitialData] function to get component\'s initial data.', this.options.mpxFileResource)
        return
      }
      this._watchers = []
      this._watcher = null
      this.localKeysMap = {} // 非props key
      this.renderData = {} // 渲染函数中收集的数据
      this.miniRenderData = {}
      this.forceUpdateData = {} // 强制更新的数据
      this.forceUpdateAll = false // 下次是否需要强制更新全部渲染数据
      this.curRenderTask = null
    }
  }

  created (...params) {
    this.initApi()
    this.callUserHook(BEFORECREATE)
    if (__mpx_mode__ !== 'web') {
      this.initState(this.options)
    }
    this.state = CREATED
    this.callUserHook(CREATED, ...params)
    if (__mpx_mode__ !== 'web') {
      // 强制走小程序原生渲染逻辑
      this.options.__nativeRender__ ? this.doRender() : this.initRender()
    }
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
        if (this.isMounted()) {
          this.callUserHook(UPDATED)
        }
      })
    }
  }

  destroyed () {
    this.state = DESTROYED
    if (__mpx_mode__ !== 'web') {
      this.clearWatchers()
    }
    this.callUserHook(DESTROYED)
  }

  initApi () {
    // 挂载扩展属性到实例上
    proxy(this.target, this.options.proto, Object.keys(this.options.proto), true, (key) => {
      if (this.ignoreProxyMap[key]) return false
      error(`The key [${key}] of mpx.prototype exist in the component/page instance already, please check your plugins!`, this.options.mpxFileResource)
    })
    // 挂载混合模式下createPage中的自定义属性，模拟原生Page构造器的表现
    if (this.options.__type__ === 'page' && !this.options.__pageCtor__) {
      proxy(this.target, this.options, this.options.mpxCustomKeysForBlend, undefined, (key) => {
        if (this.ignoreProxyMap[key]) return false
        error(`The key [${key}] of page options exist in the page instance already, please check your page options!`, this.options.mpxFileResource)
      })
    }
    if (__mpx_mode__ !== 'web') {
      // 挂载$watch
      this.target.$watch = (...rest) => this.watch(...rest)
      // 强制执行render
      this.target.$forceUpdate = (...rest) => this.forceUpdate(...rest)
      this.target.$nextTick = fn => this.nextTick(fn)
    }
  }

  initState () {
    const options = this.options
    const proxyedKeys = this.initData(options.data, options.dataFn)
    const proxyedKeysMap = makeMap(proxyedKeys)
    this.initComputed(options.computed)
    // target的数据访问代理到将proxy的data
    proxy(this.target, this.data, undefined, undefined, (key) => {
      if (this.ignoreProxyMap[key]) return false
      if (!proxyedKeysMap[key]) error(`The data/props/computed key [${key}] exist in the component/page instance already, please check and rename it!`, this.options.mpxFileResource)
    })
    this.initWatch(options.watch)
  }

  initComputed (computedOpt) {
    if (computedOpt) {
      this.collectLocalKeys(computedOpt)
      initComputed(this, this.data, computedOpt)
    }
  }

  // 构建响应式data
  initData (data, dataFn) {
    let proxyedKeys = []
    // 获取包含data/props在内的初始数据，包含初始原生微信转换支付宝时合并props进入data的逻辑
    const initialData = this.target.__getInitialData() || {}
    // 之所以没有直接使用initialData，而是通过对原始dataOpt进行深clone获取初始数据对象，主要是为了避免小程序自身序列化时错误地转换数据对象，比如将promise转为普通object
    this.data = diffAndCloneA(data || {}).clone
    if (dataFn) {
      proxyedKeys = Object.keys(initialData)
      // 预先将initialData代理到this.target中，便于data函数访问
      proxy(this.target, initialData, proxyedKeys, undefined, (key) => {
        if (this.ignoreProxyMap[key]) return false
        error(`The props key [${key}] exist in the component instance already, please check and rename it!`, this.options.mpxFileResource)
      })
      Object.assign(this.data, dataFn.call(this.target))
    }
    this.collectLocalKeys(this.data)
    Object.keys(initialData).forEach((key) => {
      if (!this.data.hasOwnProperty(key)) {
        // 除了data函数返回的数据外深拷贝切断引用关系，避免后续watch由于小程序内部对data赋值重复触发watch
        this.data[key] = diffAndCloneA(initialData[key]).clone
      }
    })
    // mpxCid 解决支付宝环境selector为全局问题
    this.data.mpxCid = this.uid
    this.localKeysMap.mpxCid = true
    observe(this.data, true)
    return proxyedKeys
  }

  initWatch (watch) {
    if (watch) {
      for (const key in watch) {
        const handler = watch[key]
        if (Array.isArray(handler)) {
          for (let i = 0; i < handler.length; i++) {
            this.watch(key, handler[i])
          }
        } else {
          this.watch(key, handler)
        }
      }
    }
  }

  collectLocalKeys (data) {
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        this.localKeysMap[key] = true
      }
    }
  }

  nextTick (fn) {
    if (typeof fn === 'function') {
      queueWatcher(() => {
        this.curRenderTask ? this.curRenderTask.promise.then(fn) : fn()
      })
    }
  }

  callUserHook (hookName, ...params) {
    const hook = this.options[hookName] || this.target[hookName]
    if (typeof hook === 'function') {
      hook.call(this.target, ...params)
    }
  }

  watch (expOrFn, cb, options) {
    return watch(this, expOrFn, cb, options)
  }

  clearWatchers () {
    let i = this._watchers.length
    while (i--) {
      this._watchers[i].teardown()
    }
  }

  render () {
    const renderData = this.data
    this.doRender(this.processRenderDataWithStrictDiff(renderData))
  }

  renderWithData () {
    const renderData = preProcessRenderData(this.renderData)
    this.doRender(this.processRenderDataWithStrictDiff(renderData))
    // 重置renderData准备下次收集
    this.renderData = {}
  }

  processRenderDataWithDiffData (result, key, diffData) {
    Object.keys(diffData).forEach((subKey) => {
      result[key + subKey] = diffData[subKey]
    })
  }

  processRenderDataWithStrictDiff (renderData) {
    const result = {}
    for (let key in renderData) {
      if (renderData.hasOwnProperty(key)) {
        const data = renderData[key]
        const firstKey = getFirstKey(key)
        if (!this.localKeysMap[firstKey]) {
          continue
        }
        // 外部clone，用于只需要clone的场景
        let clone
        if (this.miniRenderData.hasOwnProperty(key)) {
          const { clone: localClone, diff, diffData } = diffAndCloneA(data, this.miniRenderData[key])
          clone = localClone
          if (diff) {
            this.miniRenderData[key] = clone
            if (diffData && EXPORT_MPX.config.useStrictDiff) {
              this.processRenderDataWithDiffData(result, key, diffData)
            } else {
              result[key] = clone
            }
          }
        } else {
          let processed = false
          const miniRenderDataKeys = Object.keys(this.miniRenderData)
          for (let i = 0; i < miniRenderDataKeys.length; i++) {
            const tarKey = miniRenderDataKeys[i]
            if (aIsSubPathOfB(tarKey, key)) {
              if (!clone) clone = diffAndCloneA(data).clone
              delete this.miniRenderData[tarKey]
              this.miniRenderData[key] = result[key] = clone
              processed = true
              continue
            }
            const subPath = aIsSubPathOfB(key, tarKey)
            if (subPath) {
              // setByPath 更新miniRenderData中的子数据
              _getByPath(this.miniRenderData[tarKey], subPath, (current, subKey, meta) => {
                if (meta.isEnd) {
                  const { clone, diff, diffData } = diffAndCloneA(data, current[subKey])
                  if (diff) {
                    current[subKey] = clone
                    if (diffData && EXPORT_MPX.config.useStrictDiff) {
                      this.processRenderDataWithDiffData(result, key, diffData)
                    } else {
                      result[key] = clone
                    }
                  }
                } else if (!current[subKey]) {
                  current[subKey] = {}
                }
                return current[subKey]
              })
              processed = true
              break
            }
          }
          if (!processed) {
            // 如果当前数据和上次的miniRenderData完全无关，但存在于组件的视图数据中，则与组件视图数据进行diff
            if (this.target.data.hasOwnProperty(firstKey)) {
              const localInitialData = getByPath(this.target.data, key)
              const { clone, diff, diffData } = diffAndCloneA(data, localInitialData)
              this.miniRenderData[key] = clone
              if (diff) {
                if (diffData && EXPORT_MPX.config.useStrictDiff) {
                  this.processRenderDataWithDiffData(result, key, diffData)
                } else {
                  result[key] = clone
                }
              }
            } else {
              if (!clone) clone = diffAndCloneA(data).clone
              this.miniRenderData[key] = result[key] = clone
            }
          }
        }
        if (this.forceUpdateAll) {
          if (!clone) clone = diffAndCloneA(data).clone
          this.forceUpdateData[key] = clone
        }
      }
    }
    return result
  }

  doRender (data, cb) {
    if (typeof this.target.__render !== 'function') {
      error('Please specify a [__render] function to render view.', this.options.mpxFileResource)
      return
    }
    if (typeof cb !== 'function') {
      cb = undefined
    }

    const isEmpty = isEmptyObject(data) && isEmptyObject(this.forceUpdateData)
    const resolve = this.renderTaskExecutor(isEmpty)

    if (isEmpty) {
      cb && cb()
      return
    }

    // 使用forceUpdateData后清空
    if (!isEmptyObject(this.forceUpdateData)) {
      data = mergeData({}, data, this.forceUpdateData)
      this.forceUpdateData = {}
      this.forceUpdateAll = false
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

  initRender () {
    let renderWatcher
    if (this.target.__injectedRender) {
      renderWatcher = new Watcher(this, () => {
        try {
          return this.target.__injectedRender()
        } catch (e) {
          if (!EXPORT_MPX.config.ignoreRenderError) {
            warn(`Failed to execute render function, degrade to full-set-data mode.`, this.options.mpxFileResource, e)
          }
          this.render()
        }
      }, noop)
    } else {
      renderWatcher = new Watcher(this, () => {
        this.render()
      }, noop)
    }
    this._watcher = renderWatcher
  }

  forceUpdate (data, callback) {
    if (typeof data === 'function') {
      callback = data
      data = undefined
    }

    if (isPlainObject(data)) {
      this.forceUpdateData = data
      Object.keys(this.forceUpdateData).forEach(key => {
        if (!this.options.__nativeRender__ && !this.localKeysMap[getFirstKey(key)]) {
          warn(`ForceUpdate data includes a props/computed key [${key}], which may yield a unexpected result!`, this.options.mpxFileResource)
        }
        setByPath(this.data, key, this.forceUpdateData[key])
      })
    } else {
      this.forceUpdateAll = true
    }

    if (callback) {
      callback = callback.bind(this.target)
      this.nextTick(callback)
    }
    if (this._watcher) {
      this._watcher.update()
    } else {
      if (this.forceUpdateAll) {
        Object.keys(this.data).forEach((key) => {
          if (this.localKeysMap[key]) {
            this.forceUpdateData[key] = diffAndCloneA(this.data[key]).clone
          }
        })
      }
      this.doRender()
    }
  }
}
