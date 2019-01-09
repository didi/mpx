import {
  observable,
  comparer
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
  diffAndCloneA,
  defineGetter,
  isValidIdentifierStr,
  isNumberStr
} from '../helper/utils'

import {watch} from './watcher'

export default class MPXProxy {
  constructor (options, target) {
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
    this.cacheData = extend({}, this.initialData) // 缓存数据，用于diff
    this.init(options)
  }

  init (options) {
    const proxyData = extend({}, this.initialData)
    this.initComputed(options.computed, proxyData)
    this.data = observable(proxyData)
    /* 计算属性在mobx里面是不可枚举的，所以篡改下 */
    enumerable(this.data, this.computedKeys)
    /* target的数据访问代理到将proxy的data */
    proxy(this.target, this.data, enumerableKeys(this.data))
    // 初始化watch
    this.initWatch(options.watch)
  }

  initComputed (computedConfig, proxyData) {
    this.computedKeys.forEach(key => {
      if (key in proxyData) {
        console.error(`the computed key 【${key}】 is duplicated, please check`)
      } else {
        defineGetter(proxyData, key, computedConfig[key], this.target)
      }
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
    this.callUserHook('updated')
  }

  callUserHook (hookName) {
    const hook = this.target.$rawOptions[hookName]
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
    if (typeof this.target.__render !== 'function') {
      console.error('please specify a 【__render】 function to render view')
      return
    }
    const forceUpdateKeys = this.forceUpdateKeys
    const newData = deleteProperties(this.data, this.propKeys)
    Object.keys(newData).forEach(key => {
      const isForceUpdateKey = forceUpdateKeys.indexOf(key) > -1
      if (!isForceUpdateKey && comparer.structural(this.cacheData[key], newData[key])) {
        // 强制更新的key，无论是否变化，都要进行最终的setData
        delete newData[key]
      } else {
        this.cacheData[key] = newData[key]
      }
    })
    this.target.__render(newData, () => this.handleUpdatedCallbacks())
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

  renderWithDiffClone () {
    const selfData = deleteProperties(this.data, this.propKeys)
    const result = diffAndCloneA(selfData, this.selfDataClone || {})
    this.selfDataClone = result.clone
    if (result.diff) {
      let renderData = {}
      const forceUpdateKeys = this.forceUpdateKeys
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

        if (this.forceUpdateKeys.indexOf(diffPath[0]) > -1) {
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
              key += `.${path}`
            }
          }
        }
        if (key) {
          renderData[key] = value
        }
      }
      this.doRender(renderData)
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
    let renderExecutionFailed = false
    if (this.target.__injectedRender) {
      renderWatcher = watch(this.target, () => {
        if (renderExecutionFailed) {
          this.render()
        } else {
          try {
            this.target.__injectedRender()
          } catch (e) {
            console.warn(`Failed to execute render function, degrade to full-set-data mode!`)
            console.warn(e)
            console.warn('If the render function execution failed because of "__wxs_placeholder", ignore this warning.')
            renderExecutionFailed = true
            this.render()
          }
        }
      }, {
        handler: () => {
          if (!renderExecutionFailed) {
            this.renderWithDiffClone()
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
