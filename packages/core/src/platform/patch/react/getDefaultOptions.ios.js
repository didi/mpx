import { useEffect, useSyncExternalStore, useRef, createElement, memo } from 'react'
import * as reactNative from 'react-native'
import { ReactiveEffect } from '../../../observer/effect'
import { set } from '../../../observer/reactive'
import { hasOwn, isFunction, noop, isObject, error, getByPath } from '@mpxjs/utils'
import MpxProxy from '../../../core/proxy'
import { BEFOREUPDATE, UPDATED } from '../../../core/innerLifecycle'
import mergeOptions from '../../../core/mergeOptions'
import { queueJob, nextTick } from '../../../observer/scheduler'

function getNativeComponent (tagName) {
  return getByPath(reactNative, tagName)
}

function createEffect (proxy, components) {
  const update = proxy.update = () => {
    // pre render for props update
    if (proxy.propsUpdatedFlag) {
      proxy.updatePreRender()
    }
    if (proxy.isMounted()) {
      proxy.callHook(BEFOREUPDATE)
      proxy.pendingUpdatedFlag = true
    }
    // eslint-disable-next-line symbol-description
    proxy.stateVersion = Symbol()
    proxy.onStoreChange && proxy.onStoreChange()
  }
  update.id = proxy.uid
  proxy.effect = new ReactiveEffect(() => {
    return proxy.target.__injectedRender(createElement, components, getNativeComponent)
  }, () => queueJob(update), proxy.scope)
}

const datasetReg = /^data-(.+)$/

function collectDataset (props) {
  const dataset = {}
  for (const key in props) {
    if (hasOwn(props, key)) {
      const matched = datasetReg.exec(key)
      if (matched) {
        dataset[matched[1]] = props[key]
      }
    }
  }
  return dataset
}

function createInstance ({ props, ref, type, rawOptions, currentInject, validProps, components }) {
  const instance = Object.create({
    setData (newData, callback) {
      Object.keys(newData).forEach((key) => {
        // this 挂载 data 并响应性处理
        set(this, key, newData[key])
      })
      this.__mpxProxy.forceUpdate(callback)
    },
    __getProps () {
      const propsData = {}
      if (props) {
        Object.keys(props).forEach((key) => {
          if (hasOwn(validProps, key) && !isFunction(props[key])) {
            propsData[key] = props[key]
          }
        })
      }
      return propsData
    },
    __render () {
      // eslint-disable-next-line symbol-description
      this.__mpxProxy.stateVersion = Symbol()
      this.__mpxProxy.onStoreChange && this.__mpxProxy.onStoreChange()
    },
    __injectedRender: currentInject.render || noop,
    __getRefsData () {
    },
    // render helper
    _i (val, fn) {
      let i, l, keys, key
      const result = []
      if (Array.isArray(val) || typeof val === 'string') {
        for (i = 0, l = val.length; i < l; i++) {
          result.push(fn.call(this, val[i], i))
        }
      } else if (typeof val === 'number') {
        for (i = 0; i < val; i++) {
          result.push(fn.call(this, i + 1, i))
        }
      } else if (isObject(val)) {
        keys = Object.keys(val)
        for (i = 0, l = keys.length; i < l; i++) {
          key = keys[i]
          result.push(fn.call(this, val[key], key, i))
        }
      }
      return result
    },
    triggerEvent (eventName, eventDetail) {
      const handlerName = eventName.replace(/^./, matched => matched.toUpperCase()).replace(/-([a-z])/g, (match, p1) => p1.toUpperCase())
      const handler = props && (props['bind' + handlerName] || props['catch' + handlerName] || props['capture-bind' + handlerName] || props['capture-catch' + handlerName])
      if (handler && typeof handler === 'function') {
        const timeStamp = +new Date()
        const dataset = collectDataset(props)
        const id = props.id || ''
        const eventObj = {
          type: eventName,
          timeStamp,
          target: {
            id,
            dataset,
            targetDataset: dataset
          },
          currentTarget: {
            id,
            dataset
          },
          detail: eventDetail
        }
        handler.call(this, eventObj)
      }
    },
    selectComponent () {
      error('selectComponent is not supported in react native, please use ref instead')
    },
    selectAllComponents () {
      error('selectAllComponents is not supported in react native, please use ref instead')
    },
    createSelectorQuery () {
      error('createSelectorQuery is not supported in react native, please use ref instead')
    },
    createIntersectionObserver () {
      error('createIntersectionObserver is not supported in react native, please use ref instead')
    },
    ...rawOptions.methods
  })

  const proxy = instance.__mpxProxy = new MpxProxy(rawOptions, instance)
  proxy.created()
  Object.assign(proxy, {
    onStoreChange: null,
    // eslint-disable-next-line symbol-description
    stateVersion: Symbol(),
    subscribe: (onStoreChange) => {
      if (!proxy.effect) {
        createEffect(proxy, components)
        // eslint-disable-next-line symbol-description
        proxy.stateVersion = Symbol()
      }
      proxy.onStoreChange = onStoreChange
      return () => {
        proxy.effect && proxy.effect.stop()
        proxy.effect = null
        proxy.onStoreChange = null
      }
    },
    getSnapshot: () => {
      return proxy.stateVersion
    }
  })
  // react数据响应组件更新管理器
  if (!proxy.effect) {
    createEffect(proxy, components)
  }

  return instance
}

export function getDefaultOptions ({ type, rawOptions = {}, currentInject }) {
  rawOptions = mergeOptions(rawOptions, type, false)
  const components = currentInject.getComponents() || {}
  const validProps = Object.assign({}, rawOptions.props, rawOptions.properties)
  return memo((props, ref) => {
    const instanceRef = useRef(null)
    if (!instanceRef.current) {
      instanceRef.current = createInstance({ props, ref, type, rawOptions, currentInject, validProps, components })
    }
    const instance = instanceRef.current
    const proxy = instance.__mpxProxy
    // 处理props更新
    Object.keys(props).forEach(key => {
      if (hasOwn(validProps, key) && !isFunction(props[key])) {
        instance[key] = props[key]
      }
    })
    proxy.propsUpdated()

    useEffect(() => {
      if (proxy.pendingUpdatedFlag) {
        proxy.pendingUpdatedFlag = false
        proxy.callHook(UPDATED)
      }
    })

    useEffect(() => {
      proxy.mounted()
      return () => {
        proxy.unmounted()
      }
    }, [])

    useSyncExternalStore(proxy.subscribe, proxy.getSnapshot)

    return proxy.effect.run()
  })
}
