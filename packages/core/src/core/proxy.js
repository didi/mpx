import { reactive } from '../observer/reactive'
import { ReactiveEffect } from '../observer/effect'
import { EffectScope } from '../observer/effectScope'
import { watch, instanceWatch } from '../observer/watch'
import { computed } from '../observer/computed'
import { queueJob } from '../observer/scheduler'
import { isFunction } from '../helper/utils'
import EXPORT_MPX from '../index'
import {
  type,
  noop,
  proxy,
  isEmptyObject,
  isPlainObject,
  processUndefined,
  setByPath,
  getByPath,
  diffAndCloneA,
  preProcessRenderData,
  mergeData,
  aIsSubPathOfB,
  getFirstKey,
  makeMap,
  hasOwn,
  isObject,
  isFunction
} from '../helper/utils'
import _getByPath from '../helper/getByPath'
import { getRenderCallBack } from '../platform/patch'
import {
  BEFORECREATE,
  CREATED,
  BEFOREMOUNT,
  MOUNTED,
  UPDATED,
  DESTROYED,
  ONLOAD
} from './innerLifecycle'
import { warn, error } from '../helper/log'
import { callWithErrorHandling } from '../helper/errorHandling'

let uid = 0

export default class MpxProxy {
  constructor (options, target) {
    this.target = target
    this.uid = uid++
    this.name = options.name || ''
    this.options = options
    // beforeCreate -> created -> mounted -> destroyed
    this.state = BEFORECREATE
    this.ignoreProxyMap = makeMap(EXPORT_MPX.config.ignoreProxyWhiteList)
    if (__mpx_mode__ !== 'web') {
      this.scope = new EffectScope(true)
      // props响应式数据代理
      this.props = {}
      // data响应式数据代理
      this.data = {}
      // 非props key
      this.localKeysMap = {}
      // 收集setup中动态注册的hooks
      this.hooks = {}
      // 渲染函数中收集的数据
      this.renderData = {}
      // 最小渲染数据
      this.miniRenderData = {}
      // 强制更新的数据
      this.forceUpdateData = {}
      // 下次是否需要强制更新全部渲染数据
      this.forceUpdateAll = false
      this.curRenderTask = null
    }
  }

  created (params) {
    this.initApi()
    if (__mpx_mode__ !== 'web') {
      setCurrentInstance(this)
      this.initProps()
      this.initSetup()
    }
    // beforeCreate需要在setup执行过后执行
    this.callUserHook(BEFORECREATE)

    if (__mpx_mode__ !== 'web') {
      this.initData()
      this.initComputed()
      this.initWatch()
      unsetCurrentInstance()
    }

    this.state = CREATED
    this.callUserHook(CREATED, params)

    if (__mpx_mode__ !== 'web') {
      this.initRender()
    }
  }

  reCreated (params) {
    const options = this.options
    this.state = BEFORECREATE
    this.callUserHook(BEFORECREATE)
    if (__mpx_mode__ !== 'web') {
      this.initComputed(options.computed, true)
      this.initWatch(options.watch)
    }
    this.state = CREATED
    this.callUserHook(CREATED, params)
    if (__mpx_mode__ !== 'web') {
      this.initRender()
    }
    this.nextTick(() => {
      this.mounted()
    })
  }

  renderTaskExecutor (isEmptyRender) {
    if ((!this.isMounted() && this.curRenderTask) || (this.isMounted() && isEmptyRender)) {
      return
    }
    this.curRenderTask = {
      state: 'pending'
    }
    const promise = new Promise(resolve => {
      this.curRenderTask.resolve = (res) => {
        this.curRenderTask.state = 'finished'
        resolve(res)
      }
    })
    this.curRenderTask.promise = promise
    // isMounted之前基于mounted触发，isMounted之后基于setData回调触发
    return this.isMounted() && this.curRenderTask.resolve
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
      this.callUserHook(UPDATED)
    }
  }

  destroyed () {
    this.state = DESTROYED
    if (__mpx_mode__ !== 'web') {
      this.clearWatchers()
    }
    this.callUserHook(DESTROYED)
  }

  isDestroyed () {
    return this.state === DESTROYED
  }

  createProxyConflictHandler (owner) {
    return () => {
      if (this.ignoreProxyMap[key]) {
        error(`The ${owner} key [${key}] is a reserved keyword of miniprogram, please check and rename it.`, this.options.mpxFileResource)
        return false
      }
      error(`The ${owner} key [${key}] exist in the current instance already, please check and rename it.`, this.options.mpxFileResource)
    }
  }

  initApi () {
    // 挂载扩展属性到实例上
    proxy(this.target, this.options.proto, undefined, true, this.createProxyConflictHandler('mpx.prototype'))
    // 挂载混合模式下createPage中的自定义属性，模拟原生Page构造器的表现
    if (this.options.__type__ === 'page' && !this.options.__pageCtor__) {
      proxy(this.target, this.options, this.options.mpxCustomKeysForBlend, false, this.createProxyConflictHandler('page options'))
    }
    if (__mpx_mode__ !== 'web') {
      // 挂载$watch
      this.target.$watch = (...rest) => this.watch(...rest)
      // 强制执行render
      this.target.$forceUpdate = (...rest) => this.forceUpdate(...rest)
      this.target.$nextTick = fn => this.nextTick(fn)
    }
  }

  initProps () {
    this.props = diffAndCloneA(this.target.__getProps(this.options)).clone
    reactive(this.props)
    proxy(this.target, this.props, undefined, false, this.createProxyConflictHandler('props'))
  }

  initSetup () {
    const setup = this.options.setup
    if (setup) {
      const setupResult = callWithErrorHandling(setup, this, 'setup function', [
        this.props,
        {
          triggerEvent: this.target.triggerEvent.bind(this.target)
        }
      ])
      if (!isObject(setupResult)) {
        error(`Setup() should return a object, received: ${type(setupResult)}.`, this.options.mpxFileResource)
        return
      }
      proxy(this.target, setupResult, undefined, false, this.createProxyConflictHandler('setup result'))
      this.collectLocalKeys(setupResult, (key, val) => !isFunction(val))
    }
  }

  initData () {
    const data = this.options.data
    const dataFn = this.options.dataFn
    // 之所以没有直接使用initialData，而是通过对原始dataOpt进行深clone获取初始数据对象，主要是为了避免小程序自身序列化时错误地转换数据对象，比如将promise转为普通object
    this.data = diffAndCloneA(data || {}).clone
    // 执行dataFn
    if (isFunction(dataFn)) {
      Object.assign(this.data, callWithErrorHandling(dataFn.bind(this.target), this, 'data function'))
    }
    reactive(this.data)
    proxy(this.target, this.data, undefined, false, this.createProxyConflictHandler('data'))
    this.collectLocalKeys(this.data)
  }

  initComputed () {
    const computedOpt = this.options.computed
    if (computedOpt) {
      const computedObj = {}
      Object.entries(computedOpt).forEach(([key, opt]) => {
        const get = isFunction(opt)
          ? opt.bind(this.target)
          : isFunction(opt.get)
            ? opt.get.bind(this.target)
            : noop

        const set = !isFunction(opt) && isFunction(opt.set)
          ? opt.set.bind(this.target)
          : () => warn(`Write operation failed: computed property "${key}" is readonly.`, this.options.mpxFileResource)

        computedObj[key] = computed({ get, set })
      })

      this.collectLocalKeys(computedObj)
      proxy(this.target, computedObj, undefined, false, this.createProxyConflictHandler('computed'))
    }
  }


  initWatch () {
    const watch = this.options.watch
    if (watch) {
      Object.entries(watch).forEach(([key, handler]) => {
        if (Array.isArray(handler)) {
          for (let i = 0; i < handler.length; i++) {
            this.watch(key, handler[i])
          }
        } else {
          this.watch(key, handler)
        }
      })
    }
  }

  collectLocalKeys (data, filter = () => true) {
    Object.keys(data).filter((key) => filter(key, data[key])).forEach((key) => {
      this.localKeysMap[key] = true
    })
  }

  nextTick (fn) {
    if (typeof fn === 'function') {
      queueWatcher(() => {
        this.curRenderTask ? this.curRenderTask.promise.then(fn) : fn()
      })
    }
  }

  callUserHook (hookName, params, hooksOnly) {
    const hook = this.options[hookName] || this.target[hookName]
    const hooks = this.hooks[hookName] || []
    let result
    if (isFunction(hook) && !hooksOnly) {
      result = callWithErrorHandling(hook.bind(this.target), this, `${hookName} hook`, params)
    }
    hooks.forEach((hook) => {
      result = callWithErrorHandling(hook.bind(this.target), this, `${hookName} hook`, params)
    })
    return result
  }

  watch (expOrFn, cb, options) {
    return instanceWatch(this, expOrFn, cb, options)
  }

  clearWatchers () {
    let i = this._watchers.length
    while (i--) {
      this._watchers[i].teardown()
    }
    this._watchers.length = 0
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
      if (hasOwn(renderData, key)) {
        const data = renderData[key]
        const firstKey = getFirstKey(key)
        if (!this.localKeysMap[firstKey]) {
          continue
        }
        // 外部clone，用于只需要clone的场景
        let clone
        if (hasOwn(this.miniRenderData, key)) {
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
            if (this.target.data && hasOwn(this.target.data, firstKey)) {
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
    data = processUndefined(data)
    if (typeof EXPORT_MPX.config.setDataHandler === 'function') {
      try {
        EXPORT_MPX.config.setDataHandler(data, this.target)
      } catch (e) {
      }
    }
    this.target.__render(data, callback)
  }

  initRender () {
    if (this.options.__nativeRender__) return this.doRender()

    this.effect = new ReactiveEffect(() => {
      if (this.target.__injectedRender) {
        try {
          return this.target.__injectedRender()
        } catch (e) {
          warn(`Failed to execute render function, degrade to full-set-data mode.`, this.options.mpxFileResource, e)
          this.render()
        }
      } else {
        this.render()
      }
    }, () => queueJob(update), this.scope)

    const update = this.effect.run.bind(this.effect)
    update.id = this.uid
    update()
  }

  forceUpdate (data, options, callback) {
    if (typeof data === 'function') {
      callback = data
      data = undefined
    }

    options = options || {}

    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    if (isPlainObject(data)) {
      this.forceUpdateData = data
      Object.keys(this.forceUpdateData).forEach(key => {
        if (!this.options.__nativeRender__ && !this.localKeysMap[getFirstKey(key)]) {
          warn(`ForceUpdate data includes a props/computed key [${key}], which may yield a unexpected result.`, this.options.mpxFileResource)
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
    if (this.effect) {
      this.effect.run()
    } else {
      if (this.forceUpdateAll) {
        Object.keys(this.data).forEach((key) => {
          if (this.localKeysMap[key]) {
            this.forceUpdateData[key] = diffAndCloneA(this.data[key]).clone
          }
        })
      }
      options.sync ? this.doRender() : queueWatcher(() => {
        this.doRender()
      })
    }
  }
}

export let currentInstance = null

export const getCurrentInstance = () => currentInstance

export const setCurrentInstance = (instance) => {
  currentInstance = instance
  instance.scope.on()
}

export const unsetCurrentInstance = () => {
  currentInstance && currentInstance.scope.off()
  currentInstance = null
}


export const injectHook = (hookName, hook, instance = currentInstance) => {
  if (isFunction(hook) && instance?.hooks) (instance.hooks[hookName] || (instance.hooks[hookName] = [])).push(hook)
}

export const onBeforeCreate = (fn) => injectHook(BEFORECREATE, fn)
export const onCreated = (fn) => injectHook(CREATED, fn)
export const onBeforeMount = (fn) => injectHook(BEFOREMOUNT, fn)
export const onMounted = (fn) => injectHook(MOUNTED, fn)
export const onUpdated = (fn) => injectHook(UPDATED, fn)
export const onDestroyed = (fn) => injectHook(DESTROYED, fn)
export const onLoad = (fn) => injectHook(ONLOAD, fn)


