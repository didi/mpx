import { useEffect, useSyncExternalStore, useRef, createElement, memo, forwardRef, useImperativeHandle } from 'react'
import * as reactNative from 'react-native'
import { ReactiveEffect } from '../../../observer/effect'
import { hasOwn, isFunction, noop, isObject, getByPath } from '@mpxjs/utils'
import MpxProxy from '../../../core/proxy'
import { BEFOREUPDATE, UPDATED } from '../../../core/innerLifecycle'
import mergeOptions from '../../../core/mergeOptions'
import { queueJob } from '../../../observer/scheduler'

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

function createInstance ({ props, refs, type, rawOptions, currentInject, validProps, components }) {
  const instance = Object.create({
    setData () {
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
    },
    __refs: refs,
    __injectedRender: currentInject.render || noop,
    __getRefsData: currentInject.getRefsData || noop,
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
    triggerEvent () {
    },
    selectComponent () {
    },
    selectAllComponents () {
    },
    createSelectorQuery () {
    },
    createIntersectionObserver () {
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
  return memo(forwardRef((props, ref) => {
    const refs = useRef({})
    const instanceRef = useRef(null)
    if (!instanceRef.current) {
      instanceRef.current = createInstance({ props, refs, type, rawOptions, currentInject, validProps, components })
    }
    const instance = instanceRef.current
    useImperativeHandle(ref, () => {
      return instance
    })
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
  }))
}
