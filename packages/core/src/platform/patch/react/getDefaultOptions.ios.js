import { useEffect, useLayoutEffect, useSyncExternalStore, useRef, useMemo, createElement, memo, forwardRef, useImperativeHandle, useContext, createContext, Fragment, cloneElement } from 'react'
import * as ReactNative from 'react-native'
import { ReactiveEffect } from '../../../observer/effect'
import { watch } from '../../../observer/watch'
import { reactive, set, del } from '../../../observer/reactive'
import { hasOwn, isFunction, noop, isObject, error, getByPath, collectDataset, hump2dash } from '@mpxjs/utils'
import MpxProxy from '../../../core/proxy'
import { BEFOREUPDATE, ONLOAD, UPDATED, ONSHOW, ONHIDE, ONRESIZE, REACTHOOKSEXEC } from '../../../core/innerLifecycle'
import mergeOptions from '../../../core/mergeOptions'
import { queueJob } from '../../../observer/scheduler'
import { createSelectorQuery } from '@mpxjs/api-proxy'

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
  const getComponent = (tagName) => {
    if (tagName === 'block') return Fragment
    return components[tagName] || getByPath(ReactNative, tagName)
  }
  proxy.effect = new ReactiveEffect(() => {
    // reset instance
    proxy.target.__resetInstance()
    return proxy.target.__injectedRender(createElement, getComponent)
  }, () => queueJob(update), proxy.scope)
}

function getRootProps (props) {
  const rootProps = {}
  for (const key in props) {
    if (hasOwn(props, key)) {
      const match = /^(bind|catch|capture-bind|capture-catch|style|enable-var):?(.*?)(?:\.(.*))?$/.exec(key)
      if (match) {
        rootProps[key] = props[key]
      }
    }
  }
  return rootProps
}

function createInstance ({ propsRef, type, rawOptions, currentInject, validProps, components }) {
  const instance = Object.create({
    setData (data, callback) {
      return this.__mpxProxy.forceUpdate(data, { sync: true }, callback)
    },
    __getProps () {
      const props = propsRef.current
      const propsData = {}
      Object.keys(validProps).forEach((key) => {
        if (hasOwn(props, key)) {
          propsData[key] = props[key]
        } else {
          const altKey = hump2dash(key)
          if (hasOwn(props, altKey)) {
            propsData[key] = props[altKey]
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
        }
      })
      return propsData
    },

    __resetInstance () {
      this.__refs = {}
      this.__dispatchedSlotSet = new WeakSet()
    },
    __getSlot (name) {
      const { children } = propsRef.current
      if (children) {
        const result = []
        if (Array.isArray(children)) {
          children.forEach(child => {
            if (child?.props?.slot === name) {
              result.push(child)
            }
          })
        } else {
          if (children?.props?.slot === name) {
            result.push(children)
          }
        }
        return result.filter(item => {
          if (!isObject(item) || this.__dispatchedSlotSet.has(item)) return false
          this.__dispatchedSlotSet.add(item)
          return true
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
      const handler = props && (props['bind' + eventName] || props['catch' + eventName] || props['capture-bind' + eventName] || props['capture-catch' + eventName])
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
    selectComponent (selector) {
      return this.__selectRef(selector, 'component')
    },
    selectAllComponents (selector) {
      return this.__selectRef(selector, 'component', true)
    },
    createSelectorQuery () {
      return createSelectorQuery().in(this)
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
    },
    props: {
      get () {
        return propsRef.current
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

function usePageContext (mpxProxy, instance) {
  const { pageId } = useContext(routeContext) || {}

  instance.getPageId = () => {
    return pageId
  }

  useEffect(() => {
    let unWatch
    const hasShowHook = hasPageHook(mpxProxy, [ONSHOW, 'show'])
    const hasHideHook = hasPageHook(mpxProxy, [ONHIDE, 'hide'])
    const hasResizeHook = hasPageHook(mpxProxy, [ONRESIZE, 'resize'])
    if (hasShowHook || hasHideHook || hasResizeHook) {
      if (hasOwn(pageStatusContext, pageId)) {
        unWatch = watch(() => pageStatusContext[pageId], (newVal) => {
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
let pageId = 0

function usePageStatus (navigation, pageId) {
  let isFocused = true
  set(pageStatusContext, pageId, '')
  useEffect(() => {
    const focusSubscription = navigation.addListener('focus', () => {
      pageStatusContext[pageId] = 'show'
      isFocused = true
    })
    const blurSubscription = navigation.addListener('blur', () => {
      pageStatusContext[pageId] = 'hide'
      isFocused = false
    })
    const unWatchAppFocusedState = watch(global.__mpxAppFocusedState, (value) => {
      if (isFocused) {
        pageStatusContext[pageId] = value
      }
    })

    return () => {
      focusSubscription()
      blurSubscription()
      unWatchAppFocusedState()
      del(pageStatusContext, pageId)
    }
  }, [navigation])
}

export function getDefaultOptions ({ type, rawOptions = {}, currentInject }) {
  rawOptions = mergeOptions(rawOptions, type, false)
  const components = Object.assign({}, rawOptions.components, currentInject.getComponents())
  const validProps = Object.assign({}, rawOptions.props, rawOptions.properties)
  const defaultOptions = memo(forwardRef((props, ref) => {
    const instanceRef = useRef(null)
    const propsRef = useRef(null)
    propsRef.current = props
    let isFirst = false
    if (!instanceRef.current) {
      isFirst = true
      instanceRef.current = createInstance({ propsRef, type, rawOptions, currentInject, validProps, components })
    }
    const instance = instanceRef.current
    useImperativeHandle(ref, () => {
      return instance
    })

    const proxy = instance.__mpxProxy

    proxy.callHook(REACTHOOKSEXEC)

    useEffect(() => {
      if (!isFirst) {
        // 处理props更新
        Object.keys(validProps).forEach((key) => {
          if (hasOwn(props, key)) {
            instance[key] = props[key]
          } else {
            const altKey = hump2dash(key)
            if (hasOwn(props, altKey)) {
              instance[key] = props[altKey]
            }
          }
        })
      }
      if (proxy.pendingUpdatedFlag) {
        proxy.pendingUpdatedFlag = false
        proxy.callHook(UPDATED)
      }
    })

    usePageContext(proxy, instance)

    useEffect(() => {
      if (type === 'page') {
        proxy.callHook(ONLOAD, [props.route.params || {}])
      }
      proxy.mounted()
      return () => {
        proxy.unmounted()
        proxy.target.__resetInstance()
        if (type === 'page') {
          delete global.__mpxPagesMap[props.route.key]
        }
      }
    }, [])

    useSyncExternalStore(proxy.subscribe, proxy.getSnapshot)

    const root = rawOptions.options?.disableMemo ? proxy.effect.run() : useMemo(() => proxy.effect.run(), [proxy.stateVersion])
    const rootProps = getRootProps(props)
    rootProps.style = { ...root.props.style, ...rootProps.style }
    // update root props
    return cloneElement(root, rootProps)
  }))

  if (type === 'page') {
    const { Provider, useSafeAreaInsets, GestureHandlerRootView } = global.__navigationHelper
    const pageConfig = Object.assign({}, global.__mpxPageConfig, currentInject.pageConfig)
    const Page = ({ navigation, route }) => {
      const currentPageId = useMemo(() => ++pageId, [])
      usePageStatus(navigation, currentPageId)

      useLayoutEffect(() => {
        navigation.setOptions({
          headerShown: pageConfig.navigationStyle !== 'custom',
          headerTitle: pageConfig.navigationBarTitleText || '',
          headerStyle: {
            backgroundColor: pageConfig.navigationBarBackgroundColor || '#000000'
          },
          headerTintColor: pageConfig.navigationBarTextStyle || 'white'
        })
      }, [])

      navigation.insets = useSafeAreaInsets()

      return createElement(GestureHandlerRootView,
        {
          style: {
            flex: 1,
            backgroundColor: pageConfig.backgroundColor || '#ffffff'
          },
          onLayout (e) {
            navigation.layout = e.nativeEvent.layout
          }
        },
        // todo custom portal host for active route
        createElement(Provider,
          null,
          createElement(routeContext.Provider,
            {
              value: { pageId: currentPageId }
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
