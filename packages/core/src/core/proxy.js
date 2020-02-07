import {
  observable,
  comparer
} from '../mobx'

import EXPORT_MPX from '../index'

import {
  type,
  enumerableKeys,
  extend,
  proxy,
  isEmptyObject,
  processUndefined,
  defineGetterSetter,
  setByPath,
  asyncLock,
  diffAndCloneA,
  preProcessRenderData,
  filterProperties,
  mergeData, isValidIdentifierStr, aIsSubPathOfB
} from '../helper/utils'

import _getByPath from '../helper/getByPath'

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
    if (__mpx_mode__ !== 'web') {
      if (typeof target.__getInitialData !== 'function') {
        error('Please specify a [__getInitialData] function to get component\'s initial data.', this.options.mpxFileResource)
        return
      }
      this.watchers = [] // 保存所有观察者
      this.renderReaction = null
      this.computedKeys = options.computed ? enumerableKeys(options.computed) : []
      this.localKeys = this.computedKeys.slice() // 非props key
      this.forceUpdateData = {}// 强制更新的数据
      this.curRenderTask = null
    }
    this.lockTask = asyncLock()
  }

  created (...params) {
    this.initApi()
    if (__mpx_mode__ !== 'web') {
      this.initialData = this.target.__getInitialData()
      this.cacheData = extend({}, this.initialData) // 缓存数据，用于diff
    }
    this.callUserHook(BEFORECREATE)
    if (__mpx_mode__ !== 'web') {
      this.initState(this.options)
    }
    this.state = CREATED
    this.callUserHook(CREATED, ...params)
    if (__mpx_mode__ !== 'web') {
      // 强制走小程序原生渲染逻辑
      this.options.__nativeRender__ ? this.setData() : this.initRender()
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
        // 由于异步，需要确认 this.state
        if (this.isMounted()) {
          this.callUserHook(UPDATED)
        }
      })
    }
  }

  destroyed () {
    if (__mpx_mode__ !== 'web') {
      this.clearWatchers()
    }
    this.state = DESTROYED
    this.callUserHook(DESTROYED)
  }

  initApi () {
    // 挂载扩展属性到实例上
    proxy(this.target, this.options.proto, enumerableKeys(this.options.proto), true)
    // 挂载混合模式下的自定义属性
    proxy(this.target, this.options, this.options.mpxCustomKeysForBlend)
    if (__mpx_mode__ !== 'web') {
      // 挂载$watch
      this.target.$watch = (...rest) => this.watch(...rest)
      // 强制执行render
      this.target.$forceUpdate = (...rest) => this.forceUpdate(...rest)
      // 监听单次回调
      this.target.$updated = fn => {
        warn('Instance api [this.$updated] will be deprecated，please use [this.$nextTick] instead.', this.options.mpxFileResource)
        this.nextTick(fn)
      }
      this.target.$nextTick = fn => this.nextTick(fn)
    }
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
    // mpxCid 解决支付宝环境selector为全局问题
    const data = extend({
      mpxCid: this.uid
    }, typeof dataFn === 'function' ? dataFn.call(this.target) : dataFn)
    this.collectLocalKeys(data)
    return data
  }

  initComputed (computedConfig, proxyData) {
    this.computedKeys.forEach(key => {
      if (key in proxyData) {
        error(`The computed key [${key}] is duplicated, please check.`, this.options.mpxFileResource)
      }
      const getValue = computedConfig[key].get || computedConfig[key]
      const setValue = computedConfig[key].set
      defineGetterSetter(proxyData, key, getValue, setValue, this.target)
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

  callUserHook (hookName, ...params) {
    const hook = this.options[hookName]
    if (typeof hook === 'function') {
      hook.call(this.target, ...params)
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
      if (comparer.structural(this.cacheData[key], newData[key])) {
        // 强制更新的key，无论是否变化，都要进行最终的setData
        delete newData[key]
      } else {
        this.cacheData[key] = newData[key]
      }
    })
    this.doRender(newData)
  }

  renderWithData (rawRenderData) {
    const renderData = preProcessRenderData(rawRenderData)
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
      this.doRender(EXPORT_MPX.config.useStrictDiff ? this.processRenderDataWithStrictDiff(renderData) : this.processRenderData(renderData))
    }
  }

  processRenderDataWithStrictDiff (renderData) {
    const result = {}
    const miniRenderDataKeys = Object.keys(this.miniRenderData)
    for (let key in renderData) {
      if (renderData.hasOwnProperty(key)) {
        let item = renderData[key]
        let data = item[0]
        let firstKey = item[1]
        const { clone, diff, diffPaths } = diffAndCloneA(data, this.miniRenderData[key])
        if (this.miniRenderData.hasOwnProperty(key)) {
          if (this.localKeys.indexOf(firstKey) > -1 && diff) {
            this.miniRenderData[key] = clone
            if (diffPaths.length) {
              const temp = {}
              let useTemp = true
              for (let i = 0; i < diffPaths.length; i++) {
                const pathArr = diffPaths[i]
                let keyStr = ''
                let value
                _getByPath(clone, pathArr, (current, key, meta) => {
                  if (type(key) === 'Number') {
                    keyStr += `[${key}]`
                  } else if (type(key) === 'String') {
                    // setData中的key值不能包含非法标识符，遇到则提前结束
                    if (isValidIdentifierStr(key)) {
                      keyStr += `.${key}`
                    } else {
                      meta.stop = true
                    }
                  }
                  if (meta.stop) {
                    value = current
                  } else if (meta.isEnd) {
                    value = current[key]
                  }
                  return current[key]
                })
                if (keyStr) {
                  temp[keyStr] = value
                } else {
                  useTemp = false
                  break
                }
              }
              if (useTemp) {
                extend(result, temp)
              } else {
                result[key] = clone
              }
            } else {
              result[key] = clone
            }
          }
        } else {
          let processed = false
          for (let i = 0; i < miniRenderDataKeys.length; i++) {
            const tarKey = miniRenderDataKeys[i]
            if (aIsSubPathOfB(tarKey, key)) {
              delete this.miniRenderData[tarKey]
              this.miniRenderData[key] = clone
              miniRenderDataKeys.splice(i, 1, key)
              processed = true
              break
            }
            const subPath = aIsSubPathOfB(key, tarKey)
            if (subPath) {
              setByPath(this.miniRenderData[tarKey], subPath, clone)
              processed = true
              break
            }
          }
          if (!processed) {
            this.miniRenderData[key] = clone
          }
          result[key] = clone
        }
      }
    }
    return result
  }

  processRenderData (renderData) {
    const result = {}
    const missedKeyMap = Object.keys(this.miniRenderData).reduce((map, key) => {
      map[key] = true
      return map
    }, {})
    for (let key in renderData) {
      if (renderData.hasOwnProperty(key)) {
        let item = renderData[key]
        let data = item[0]
        let firstKey = item[1]
        let { clone, diff } = diffAndCloneA(data, this.miniRenderData[key])
        if (this.localKeys.indexOf(firstKey) > -1 && diff) {
          this.miniRenderData[key] = result[key] = clone
        }
        delete missedKeyMap[key]
      }
    }
    // 清理当次renderData中从未出现的key，避免出现历史脏数据导致diff失败
    for (let key in missedKeyMap) {
      if (missedKeyMap.hasOwnProperty(key)) {
        delete this.miniRenderData[key]
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
      data = mergeData({}, this.forceUpdateData, data)
      this.forceUpdateData = {}
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
    // 绑定回调中的 this 为当前组件
    if (typeof callback === 'function') {
      callback = callback.bind(this.target)
    }
    // 同步数据到proxy
    this.forceUpdate(data, callback)
    if (this.options.__nativeRender__) {
      // 走原生渲染
      return this.doRender(diffAndCloneA(data).clone)
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
            warn(`Failed to execute render function, degrade to full-set-data mode.`, this.options.mpxFileResource, e)
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

  forceUpdate (data, callback) {
    const dataType = type(data)
    if (dataType === 'Function') {
      callback = data
    } else if (dataType === 'Object') {
      this.forceUpdateData = data
      Object.keys(data).forEach(key => {
        setByPath(this.data, key, data[key])
      })
    }
    callback && this.nextTick(callback)
    // 无论是否改变，强制将状态置为stale，从而触发render
    if (this.renderReaction) {
      this.renderReaction.dependenciesState = 2
      this.renderReaction.schedule()
    }
  }


}
