import { useEffect, useLayoutEffect, useSyncExternalStore, useRef, createElement, memo, forwardRef, useImperativeHandle, useContext, createContext, Fragment } from 'react'
import * as ReactNative from 'react-native'
import { ReactiveEffect } from '../../../observer/effect'
import { watch } from '../../../observer/watch'
import { reactive, set } from '../../../observer/reactive'
import { hasOwn, isFunction, noop, isObject, error, getByPath, collectDataset } from '@mpxjs/utils'
import MpxProxy from '../../../core/proxy'
import { BEFOREUPDATE, ONLOAD, UPDATED, ONSHOW, ONHIDE, ONRESIZE } from '../../../core/innerLifecycle'
import mergeOptions from '../../../core/mergeOptions'
import { queueJob } from '../../../observer/scheduler'

function getSystemInfo () {
  const window = ReactNative.Dimensions.get('window')
  const screen = ReactNative.Dimensions.get('screen')
  return {
    deviceOrientation: window.width > window.height ? 'landscape' : 'portrait',
    size: {
      screenWidth: screen.width,
      screenHeight: screen.height,
      windowWidth: window.width,
      windowHeight: window.height
    }
  }
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
  const getComponent = (tagName) => {
    if (tagName === 'block') return Fragment
    return components[tagName] || getByPath(ReactNative, tagName)
  }
  proxy.effect = new ReactiveEffect(() => {
    return proxy.target.__injectedRender(createElement, getComponent, getRootProps(props))
  }, () => queueJob(update), proxy.scope)
}

function createInstance ({ propsRef, type, rawOptions, currentInject, validProps, components }) {
  const instance = Object.create({
    setData (data, callback) {
      return this.__mpxProxy.forceUpdate(data, { sync: true }, callback)
    },
    __getProps () {
      const propsData = {}
      const props = propsRef.current
      Object.keys(validProps).forEach((key) => {
        if (hasOwn(props, key)) {
          propsData[key] = props[key]
        } else {
          let field = validProps[key]
          if (isFunction(field) || field === null) {
            field = {
              type: field
            }
          }
          // 处理props默认值
          propsData[key] = field.value
        }
      })
      return propsData
    },
    __getSlot (name) {
      const { children } = propsRef.current
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

  const props = propsRef.current

  if (type === 'page') {
    instance.route = props.route.name
    global.__mpxPagesMap[props.route.key] = [instance, props.navigation]
  }

  const proxy = instance.__mpxProxy = new MpxProxy(rawOptions, instance)
  proxy.created()

  if (type === 'page') {
    proxy.callHook(ONLOAD, [props.route.params])
  }

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

function hasPageHook (mpxProxy, hookNames) {
  const options = mpxProxy.options
  const type = options.__type__
  return hookNames.some(h => {
    if (mpxProxy.hasHook(h)) {
      return true
    }
    if (type === 'page') {
      return isFunction(options.methods && options.methods[h])
    } else if (type === 'component') {
      return options.pageLifetimes && isFunction(options.pageLifetimes[h])
    }
    return false
  })
}

const routeContext = createContext(null)

const triggerPageStatusHook = (mpxProxy, event) => {
  mpxProxy.callHook(event === 'show' ? ONSHOW : ONHIDE)
  const pageLifetimes = mpxProxy.options.pageLifetimes
  if (pageLifetimes) {
    const instance = mpxProxy.target
    isFunction(pageLifetimes[event]) && pageLifetimes[event].call(instance)
  }
}

const triggerResizeEvent = (mpxProxy) => {
  const type = mpxProxy.options.__type__
  const systemInfo = getSystemInfo()
  const target = mpxProxy.target
  mpxProxy.callHook(ONRESIZE, [systemInfo])
  if (type === 'page') {
    target.onResize && target.onResize(systemInfo)
  } else {
    const pageLifetimes = mpxProxy.options.pageLifetimes
    pageLifetimes && isFunction(pageLifetimes.resize) && pageLifetimes.resize.call(target, systemInfo)
  }
}

function usePageContext (mpxProxy) {
  const { routeName } = useContext(routeContext) || {}

  useEffect(() => {
    let unWatch
    const hasShowHook = hasPageHook(mpxProxy, [ONSHOW, 'show'])
    const hasHideHook = hasPageHook(mpxProxy, [ONHIDE, 'hide'])
    const hasResizeHook = hasPageHook(mpxProxy, [ONRESIZE, 'resize'])
    if (hasShowHook || hasHideHook || hasResizeHook) {
      if (hasOwn(pageStatusContext, routeName)) {
        unWatch = watch(() => pageStatusContext[routeName], (newVal) => {
          if (newVal === 'show' || newVal === 'hide') {
            triggerPageStatusHook(mpxProxy, newVal)
          } else if (/^resize/.test(newVal)) {
            triggerResizeEvent(mpxProxy)
          }
        })
      }
    }

    return () => {
      unWatch && unWatch()
    }
  }, [])
}

const pageStatusContext = reactive({})
function setPageStatus (routeName, val) {
  set(pageStatusContext, routeName, val)
}

function usePageStatus (navigation, route) {
  let isFocused = true
  setPageStatus(route.name, '')
  useEffect(() => {
    setPageStatus(route.name, 'show')
    const focusSubscription = navigation.addListener('focus', () => {
      setPageStatus(route.name, 'show')
      isFocused = true
    })
    const blurSubscription = navigation.addListener('blur', () => {
      setPageStatus(route.name, 'hide')
      isFocused = false
    })

    const unWatchAppFocusedState = watch(global.__mpxAppFocusedState, (value) => {
      if (isFocused) {
        setPageStatus(route.name, value)
      }
    })

    return () => {
      focusSubscription()
      blurSubscription()
      unWatchAppFocusedState()
    }
  }, [navigation])
}

export function getDefaultOptions ({ type, rawOptions = {}, currentInject }) {
  rawOptions = mergeOptions(rawOptions, type, false)
  const components = Object.assign({}, rawOptions.components, currentInject.getComponents())
  const validProps = Object.assign({}, rawOptions.props, rawOptions.properties)
  const defaultOptions = memo(forwardRef((props, ref) => {
    const instanceRef = useRef(null)
    const propsRef = useRef(props)
    let isFirst = false
    if (!instanceRef.current) {
      isFirst = true
      instanceRef.current = createInstance({ propsRef, type, rawOptions, currentInject, validProps, components })
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
        if (hasOwn(validProps, key)) {
          instance[key] = props[key]
        }
      })
      proxy.propsUpdated()
    }

    usePageContext(proxy)

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
        if (type === 'page') {
          delete global.__mpxPagesMap[props.route.key]
        }
      }
    }, [])

    useSyncExternalStore(proxy.subscribe, proxy.getSnapshot)

    return proxy.effect.run()
  }))

  if (type === 'page') {
    const { Provider } = global.__navigationHelper
    const pageConfig = Object.assign({}, global.__mpxPageConfig, currentInject.pageConfig)
    const Page = ({ navigation, route }) => {
      usePageStatus(navigation, route)

      useLayoutEffect(() => {
        navigation.setOptions({
          headerTitle: pageConfig.navigationBarTitleText || '',
          headerStyle: {
            backgroundColor: pageConfig.navigationBarBackgroundColor || '#000000'
          },
          headerTintColor: pageConfig.navigationBarTextStyle || 'white'
        })
      }, [])

      return createElement(Provider,
        null,
        createElement(ReactNative.View,
          {
            style: {
              ...ReactNative.StyleSheet.absoluteFillObject,
              backgroundColor: pageConfig.backgroundColor || '#ffffff'
            }
          },
          createElement(routeContext.Provider,
            {
              value: { routeName: route.name }
            },
            createElement(defaultOptions,
              {
                navigation,
                route,
                pageConfig
              }
            )
          )
        )
      )
    }
    return Page
  }

  return defaultOptions
}
