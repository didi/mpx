import { useEffect, useSyncExternalStore, useRef, createElement, memo, forwardRef, useImperativeHandle } from 'react'
import * as ReactNative from 'react-native'
import { ReactiveEffect } from '../../../observer/effect'
import { hasOwn, isFunction, noop, isObject, error, getByPath, collectDataset } from '@mpxjs/utils'
import MpxProxy from '../../../core/proxy'
import { BEFOREUPDATE, UPDATED } from '../../../core/innerLifecycle'
import mergeOptions from '../../../core/mergeOptions'
import { queueJob } from '../../../observer/scheduler'

function getNativeComponent (tagName) {
  return getByPath(ReactNative, tagName)
}

function getRootProps (props) {
  const rootProps = {}
  for (const key in props) {
    if (hasOwn(props, key)) {
      const match = /^(bind|catch|capture-bind|capture-catch|style):?(.*?)(?:\.(.*))?$/.exec(key)
      if (match) {
        rootProps[key] = props[key]
      }
    }
  }
  return rootProps
}

function createEffect (proxy, components, props) {
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
    return proxy.target.__injectedRender(createElement, components, getNativeComponent, getRootProps(props))
  }, () => queueJob(update), proxy.scope)
}

function createInstance ({ propsRef, ref, type, rawOptions, currentInject, validProps, components }) {
  const instance = Object.create({
    setData (data, callback) {
      return this.__mpxProxy.forceUpdate(data, { sync: true }, callback)
    },
    __getProps () {
      const propsData = {}
      const props = propsRef.current
      if (props) {
        Object.keys(props).forEach((key) => {
          if (hasOwn(validProps, key) && !isFunction(props[key])) {
            propsData[key] = props[key]
          }
        })
      }
      return propsData
    },
    __getSlot (name) {
      const { children } = propsRef.current || {}
      if (children) {
        const result = []
        if (Array.isArray(children)) {
          children.forEach(child => {
            if (child && child.props && child.props.slot === name) {
              result.push(child)
            }
          })
        } else {
          if (children && children.props && children.props.slot === name) {
            result.push(children)
          }
        }
        return result.filter(item => {
          if (this.__dispatchedSlotSet.has(item)) {
            return false
          } else {
            this.__dispatchedSlotSet.add(item)
            return true
          }
        })
      }
      return null
    },
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
    triggerEvent (eventName, eventDetail) {
      const props = propsRef.current
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
  }, {
    dataset: {
      get () {
        const props = propsRef.current
        return collectDataset(props)
      },
      enumerable: true
    },
    id: {
      get () {
        const props = propsRef.current
        return props.id
      },
      enumerable: true
    }
  })

  const proxy = instance.__mpxProxy = new MpxProxy(rawOptions, instance)
  proxy.created()
  Object.assign(proxy, {
    onStoreChange: null,
    // eslint-disable-next-line symbol-description
    stateVersion: Symbol(),
    subscribe: (onStoreChange) => {
      if (!proxy.effect) {
        createEffect(proxy, components, propsRef.current)
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
    createEffect(proxy, components, propsRef.current)
  }

  return instance
}

export function getDefaultOptions ({ type, rawOptions = {}, currentInject }) {
  rawOptions = mergeOptions(rawOptions, type, false)
  const components = currentInject.getComponents() || {}
  const validProps = Object.assign({}, rawOptions.props, rawOptions.properties)
  const defaultOptions = memo(forwardRef((props, ref) => {
    const instanceRef = useRef(null)
    const propsRef = useRef(props)
    let isFirst = false
    if (!instanceRef.current) {
      isFirst = true
      instanceRef.current = createInstance({ propsRef, ref, type, rawOptions, currentInject, validProps, components })
    }
    const instance = instanceRef.current
    // reset instance
    instance.__refs = {}
    instance.__dispatchedSlotSet = new WeakSet()
    useImperativeHandle(ref, () => {
      return instance
    })
    const proxy = instance.__mpxProxy

    if (!isFirst) {
      // 处理props更新
      propsRef.current = props
      Object.keys(props).forEach(key => {
        if (hasOwn(validProps, key) && !isFunction(props[key])) {
          instance[key] = props[key]
        }
      })
      proxy.propsUpdated()
    }

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

  if (type === 'page') {
    const Page = (props) => {
      return createElement(ReactNative.ScrollView,
        {
          style: {
            ...ReactNative.StyleSheet.absoluteFillObject
          },
          showsVerticalScrollIndicator: false
        },
        createElement(defaultOptions)
      )
    }
    return Page
  }

  return defaultOptions
}
