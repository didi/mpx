import { useEffect, useSyncExternalStore, useRef, createElement } from 'react'
import { ReactiveEffect } from '../../../observer/effect'
import { hasOwn, isFunction, noop, isObject } from '@mpxjs/utils'
import MpxProxy from '../../../core/proxy'
import { BEFOREUPDATE, UPDATED } from '../../../core/innerLifecycle'
import mergeOptions from '../../../core/mergeOptions'

function createEffect (adm) {
  adm.effect = new ReactiveEffect(adm.render, () => {
    // eslint-disable-next-line symbol-description
    adm.stateVersion = Symbol()
    adm.onStoreChange && adm.onStoreChange()
  })
}

function useObserver (render, options) {
  const admRef = useRef(null)
  if (!admRef.current) {
    const _adm = {
      effect: null,
      onStoreChange: null,
      // eslint-disable-next-line symbol-description
      stateVersion: Symbol(),
      render,
      subscribe: (onStoreChange) => {
        if (!_adm.effect) {
          createEffect(adm)
          // eslint-disable-next-line symbol-description
          _adm.stateVersion = Symbol()
        }
        _adm.onStoreChange = onStoreChange
        return () => {
          _adm.effect && _adm.effect.stop()
          _adm.effect = null
          _adm.onStoreChange = null
        }
      },
      getSnapshot: () => {
        return _adm.stateVersion
      }
    }
    admRef.current = _adm
  }
  const adm = admRef.current
  if (!adm.effect) {
    createEffect(adm)
  }

  useSyncExternalStore(adm.subscribe, adm.getSnapshot)

  return adm.effect.run()
}

function createInstance ({ props, ref, type, rawOptions, currentInject }) {
  const instance = Object.create({
    setData () {
    },
    __getProps (options) {
      const propsData = {}
      const validProps = Object.assign({}, options.properties, options.props)
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

  return instance
}

export function getDefaultOptions ({ type, rawOptions = {}, currentInject }) {
  rawOptions = mergeOptions(rawOptions, type, false)
  // const validProps = Object.assign({}, rawOptions.props, rawOptions.properties)

  return (props, ref) => {
    const instanceRef = useRef(null)
    if (!instanceRef.current) {
      instanceRef.current = createInstance({ props, ref, type, rawOptions, currentInject })
    }
    const instance = instanceRef.current
    // 待测试完善，或许需要通过react.memo进行包裹处理props更新以及优化渲染函数执行
    // // 处理props更新
    // Object.keys(props).forEach(key => {
    //   if (hasOwn(validProps, key) && !isFunction(props[key])) {
    //     const { diff, clone } = diffAndCloneA(props[key], instance[key])
    //     // 此处进行深clone后赋值避免父级存储的miniRenderData部分数据在此处被响应化，在子组件对props赋值时触发父组件的render
    //     if (diff) instance[key] = clone
    //   }
    // })
    // //
    // this.__mpxProxy.propsUpdated()

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

    const components = currentInject.components || {}

    return useObserver(() => {
      return instance.__injectedRender(createElement, components)
    })
  }
}
