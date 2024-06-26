import transferOptions from '../core/transferOptions'
import builtInKeysMap from './patch/builtInKeysMap'
import { makeMap, spreadProp } from '@mpxjs/utils'
import { mergeLifecycle } from '../convertor/mergeLifecycle'
import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import Mpx from '../index'
import { createElement, memo, useRef, useEffect } from 'react'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

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

  global.__mpxOptionsMap = global.__mpxOptionsMap || {}
  global.__mpxOptionsMap[currentInject.moduleId] = memo(() => {
    const instanceRef = useRef(null)
    if (!instanceRef.current) {
      instanceRef.current = createAppInstance(appData)
    }
    const instance = instanceRef.current
    useEffect(() => {
      const state = navigationRef.getRootState()
      const current = state?.routes?.[state?.index] || {}
      const options = {
        path: current.name && current.name.replace(/^\//, ''),
        query: current.params,
        scene: 0,
        shareTicket: '',
        referrerInfo: {}
      }
      global.__mpxEnterOptions = options
      defaultOptions.onLaunch && defaultOptions.onLaunch.call(instance, options)
    }, [])
    return createElement(NavigationContainer, { ref: navigationRef }, createElement(Stack.Navigator, { initialRouteName: firstPage }, ...pageScreens))
  })
  global.getApp = function () {
    return appData
  }
}
