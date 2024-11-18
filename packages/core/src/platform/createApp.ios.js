import transferOptions from '../core/transferOptions'
import builtInKeysMap from './patch/builtInKeysMap'
import { makeMap, spreadProp } from '@mpxjs/utils'
import { mergeLifecycle } from '../convertor/mergeLifecycle'
import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import Mpx from '../index'
import { createElement, memo, useRef, useEffect } from 'react'
import * as ReactNative from 'react-native'
import { ref } from '../observer/ref'

const appHooksMap = makeMap(mergeLifecycle(wxLifecycle.LIFECYCLE).app)

function getOrientation (window = ReactNative.Dimensions.get('window')) {
  return window.width > window.height ? 'landscape' : 'portrait'
}

function filterOptions (options, appData) {
  const newOptions = {}
  Object.keys(options).forEach(key => {
    if (builtInKeysMap[key]) {
      return
    }
    if (!appHooksMap[key]) {
      appData[key] = options[key]
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
}

function createAppInstance (appData) {
  const instance = {
    ...Mpx.prototype,
    ...appData
  }
  return instance
}

export default function createApp (option, config = {}) {
  const appData = {}

  const { NavigationContainer, createNavigationContainerRef, createNativeStackNavigator, SafeAreaProvider } = global.__navigationHelper
  // app选项目前不需要进行转换
  const { rawOptions, currentInject } = transferOptions(option, 'app', false)
  const defaultOptions = filterOptions(spreadProp(rawOptions, 'methods'), appData)
  defaultOptions.onAppInit && defaultOptions.onAppInit()
  // 在页面script执行前填充getApp()
  global.getApp = function () {
    return appData
  }
  const pages = currentInject.getPages() || {}
  const firstPage = currentInject.firstPage
  const Stack = createNativeStackNavigator()
  const navigationRef = createNavigationContainerRef()
  const pageScreens = Object.entries(pages).map(([key, item]) => {
    return createElement(Stack.Screen, {
      name: key,
      component: item
    })
  })
  global.__mpxOptionsMap = global.__mpxOptionsMap || {}
  const onStateChange = () => {
    if (global.__navigationHelper.lastSuccessCallback) {
      global.__navigationHelper.lastSuccessCallback()
      global.__navigationHelper.lastSuccessCallback = null
    }
  }
  const onUnhandledAction = (action) => {
    const payload = action.payload
    const message = `The action '${action.type}'${payload ? ` with payload ${JSON.stringify(action.payload)}` : ''} was not handled by any navigator.`
    if (global.__navigationHelper.lastFailCallback) {
      global.__navigationHelper.lastFailCallback(message)
      global.__navigationHelper.lastFailCallback = null
    }
  }

  global.__mpxAppCbs = global.__mpxAppCbs || {
    show: [],
    hide: [],
    error: []
  }

  global.__mpxAppFocusedState = ref('show')
  global.__mpxOptionsMap[currentInject.moduleId] = memo(() => {
    const instanceRef = useRef(null)
    if (!instanceRef.current) {
      instanceRef.current = createAppInstance(appData)
    }
    const instance = instanceRef.current
    useEffect(() => {
      const current = navigationRef.isReady() ? navigationRef.getCurrentRoute() : {}
      const options = {
        path: current.name,
        query: current.params,
        scene: 0,
        shareTicket: '',
        referrerInfo: {}
      }
      global.__mpxEnterOptions = options
      defaultOptions.onLaunch && defaultOptions.onLaunch.call(instance, options)
      if (defaultOptions.onShow) {
        defaultOptions.onShow.call(instance, options)
        global.__mpxAppCbs.show.push(defaultOptions.onShow.bind(instance))
      }
      if (defaultOptions.onHide) {
        global.__mpxAppCbs.hide.push(defaultOptions.onHide.bind(instance))
      }
      if (defaultOptions.onError) {
        global.__mpxAppCbs.error.push(defaultOptions.onError.bind(instance))
      }

      const changeSubscription = ReactNative.AppState.addEventListener('change', (currentState) => {
        if (currentState === 'active') {
          global.__mpxAppCbs.show.forEach((cb) => {
            cb(options)
          })
          global.__mpxAppFocusedState.value = 'show'
        } else if (currentState === 'inactive') {
          global.__mpxAppCbs.hide.forEach((cb) => {
            cb()
          })
          global.__mpxAppFocusedState.value = 'hide'
        }
      })

      let count = 0
      let lastOrientation = getOrientation()
      const resizeSubScription = ReactNative.Dimensions.addEventListener('change', ({ window }) => {
        const orientation = getOrientation(window)
        if (orientation === lastOrientation) return
        lastOrientation = orientation
        global.__mpxAppFocusedState.value = `resize${count++}`
      })
      return () => {
        changeSubscription && changeSubscription.remove()
        resizeSubScription && resizeSubScription.remove()
      }
    }, [])

    return createElement(SafeAreaProvider,
      null,
      createElement(NavigationContainer,
        {
          ref: navigationRef,
          onStateChange,
          onUnhandledAction
        },
        createElement(Stack.Navigator,
          {
            initialRouteName: firstPage
          },
          ...pageScreens
        )
      )
    )
  })

  global.getCurrentPages = function () {
    const navigation = Object.values(global.__mpxPagesMap || {})[0]?.[1]
    if (navigation) {
      return navigation.getState().routes.map((route) => {
        return global.__mpxPagesMap[route.key] && global.__mpxPagesMap[route.key][0]
      }).filter(item => item)
    }
    return []
  }
}
