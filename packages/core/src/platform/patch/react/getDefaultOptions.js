import { useEffect, useSyncExternalStore, useRef, createElement, memo } from 'react'
import { ReactiveEffect } from '../../../observer/effect'
import { hasOwn, isFunction, noop, isObject } from '@mpxjs/utils'
import MpxProxy from '../../../core/proxy'
import { BEFOREUPDATE, UPDATED } from '../../../core/innerLifecycle'
import mergeOptions from '../../../core/mergeOptions'
import { queueJob } from '../../../observer/scheduler'

function createEffect (instance, components) {
  const update = instance.update = () => {
    // eslint-disable-next-line symbol-description
    instance.__adm.stateVersion = Symbol()
    instance.__adm.onStoreChange && instance.__adm.onStoreChange()
  }
  update.id = instance.uid
  instance.effect = new ReactiveEffect(() => {
    return instance.__injectedRender(createElement, components)
  }, () => queueJob(update), instance.scope)
}

function createInstance ({ props, ref, type, rawOptions, currentInject, validProps, components }) {
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

  instance.__mpxProxy = new MpxProxy(rawOptions, instance)
  instance.__mpxProxy.created()
  // react数据响应组件更新管理器
  instance.__adm = {
    onStoreChange: null,
    // eslint-disable-next-line symbol-description
    stateVersion: Symbol(),
    subscribe: (onStoreChange) => {
      if (!instance.effect) {
        createEffect(instance, components)
        // eslint-disable-next-line symbol-description
        instance.__adm.stateVersion = Symbol()
      }
      instance.__adm.onStoreChange = onStoreChange
      return () => {
        instance.effect && instance.effect.stop()
        instance.effect = null
        instance.__adm.onStoreChange = null
      }
    },
    getSnapshot: () => {
      return instance.__adm.stateVersion
    }
  }

  if (!instance.effect) {
    createEffect(instance, components)
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
    // 处理props更新
    Object.keys(props).forEach(key => {
      if (hasOwn(validProps, key) && !isFunction(props[key])) {
        instance[key] = props[key]
      }
    })

    useEffect(() => {
      if (instance.__mpxProxy && instance.__mpxProxy.isMounted()) {
        instance.__mpxProxy.callHook(BEFOREUPDATE)
        instance.__mpxProxy.callHook(UPDATED)
      }
    })

    useEffect(() => {
      if (instance.__mpxProxy) instance.__mpxProxy.mounted()
      return () => {
        if (instance.__mpxProxy) instance.__mpxProxy.unmounted()
      }
    }, [])

    useSyncExternalStore(instance.__adm.subscribe, instance.__adm.getSnapshot)

    return instance.effect.run()
  })
}
