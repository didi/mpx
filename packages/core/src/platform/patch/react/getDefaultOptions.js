import { useEffect, useSyncExternalStore, useRef, createElement } from 'react'
import { ReactiveEffect } from '../../../observer/effect'
import { hasOwn, isFunction, noop } from '@mpxjs/utils'
import MpxProxy from '../../../core/proxy'

function createEffect (adm) {
  adm.effect = new ReactiveEffect(adm.render, () => {
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
      stateVersion: Symbol(),
      render,
      subscribe: (onStoreChange) => {
        if (!_adm.effect) {
          createEffect(adm)
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
  return (props, ref) => {
    const instanceRef = useRef(null)
    if (!instanceRef.current) {
      instanceRef.current = createInstance({ props, ref, type, rawOptions, currentInject })
    }
    const instance = instanceRef.current
    useEffect(() => {
      if (instance.__mpxProxy) instance.__mpxProxy.mounted()
      return () => {
        if (instance.__mpxProxy) instance.__mpxProxy.unmounted()
      }
    }, [])

    const _i = instance._i.bind(instance)

    return useObserver(() => {
      return instance.__injectedRender(createElement, _i)
    })
  }
}
