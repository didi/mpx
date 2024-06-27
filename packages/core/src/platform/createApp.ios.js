import transferOptions from '../core/transferOptions'
import builtInKeysMap from './patch/builtInKeysMap'
import { makeMap, spreadProp } from '@mpxjs/utils'
import { mergeLifecycle } from '../convertor/mergeLifecycle'
import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import Mpx from '../index'
import { createElement, memo, useRef, useEffect } from 'react'

const appHooksMap = makeMap(mergeLifecycle(wxLifecycle.LIFECYCLE).app)

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

  const { NavigationContainer, createNavigationContainerRef, createNativeStackNavigator } = global.__navigationHelper
  // app选项目前不需要进行转换
  const { rawOptions, currentInject } = transferOptions(option, 'app', false)
  const defaultOptions = filterOptions(spreadProp(rawOptions, 'methods'), appData)
  defaultOptions.onAppInit && defaultOptions.onAppInit()
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
  global.__navigationRef = navigationRef
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
  global.__mpxOptionsMap[currentInject.moduleId] = memo(() => {
    const instanceRef = useRef(null)
    if (!instanceRef.current) {
      instanceRef.current = createAppInstance(appData)
    }
    const instance = instanceRef.current
    useEffect(() => {
      const current = navigationRef.getCurrentRoute() || {}
      const options = {
        path: current.name,
        query: current.params,
        scene: 0,
        shareTicket: '',
        referrerInfo: {}
      }
      global.__mpxEnterOptions = options
      defaultOptions.onLaunch && defaultOptions.onLaunch.call(instance, options)
    }, [])
    return createElement(NavigationContainer, { ref: navigationRef, onStateChange, onUnhandledAction }, createElement(Stack.Navigator, { initialRouteName: firstPage }, ...pageScreens))
  })
  global.getApp = function () {
    return appData
  }
}
