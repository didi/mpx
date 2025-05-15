import transferOptions from '../core/transferOptions'
import builtInKeysMap from './patch/builtInKeysMap'
import { makeMap, spreadProp, getFocusedNavigation, hasOwn } from '@mpxjs/utils'
import { mergeLifecycle } from '../convertor/mergeLifecycle'
import { LIFECYCLE } from '../platform/patch/lifecycle/index'
import Mpx from '../index'
import { reactive } from '../observer/reactive'
import { watch } from '../observer/watch'
import { createElement, memo, useRef, useEffect } from 'react'
import * as ReactNative from 'react-native'
import { initAppProvides } from './export/inject'
import { NavigationContainer, createStackNavigator, SafeAreaProvider } from './env/navigationHelper'

const appHooksMap = makeMap(mergeLifecycle(LIFECYCLE).app)

function getPageSize (window = ReactNative.Dimensions.get('window')) {
  return window.width + 'x' + window.height
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

export default function createApp (options) {
  const appData = {}
  // app选项目前不需要进行转换
  const { rawOptions, currentInject } = transferOptions(options, 'app', false)
  initAppProvides(rawOptions.provide, rawOptions)
  const defaultOptions = filterOptions(spreadProp(rawOptions, 'methods'), appData)
  // 在页面script执行前填充getApp()
  global.getApp = function () {
    return appData
  }

  // 模拟小程序appInstance在热启动时不会重新创建的行为，在外部创建跟随js context的appInstance
  const appInstance = Object.assign({}, appData, Mpx.prototype)

  defaultOptions.onShow && global.__mpxAppCbs.show.push(defaultOptions.onShow.bind(appInstance))
  defaultOptions.onHide && global.__mpxAppCbs.hide.push(defaultOptions.onHide.bind(appInstance))
  defaultOptions.onError && global.__mpxAppCbs.error.push(defaultOptions.onError.bind(appInstance))
  defaultOptions.onUnhandledRejection && global.__mpxAppCbs.rejection.push(defaultOptions.onUnhandledRejection.bind(appInstance))
  defaultOptions.onAppInit && defaultOptions.onAppInit()

  const pages = currentInject.getPages() || {}
  const firstPage = currentInject.firstPage
  const Stack = createStackNavigator()
  const getPageScreens = (initialRouteName, initialParams) => {
    return Object.entries(pages).map(([key, item]) => {
      const options = {
        // __mpxPageStatusMap 为编译注入的全局变量
        headerShown: !(Object.assign({}, global.__mpxPageConfig, global.__mpxPageConfigsMap[key]).navigationStyle === 'custom')
      }
      if (key === initialRouteName) {
        return createElement(Stack.Screen, {
          name: key,
          component: item,
          initialParams,
          options
        })
      }
      return createElement(Stack.Screen, {
        name: key,
        component: item,
        options
      })
    })
  }
  global.__mpxOptionsMap = global.__mpxOptionsMap || {}
  const onStateChange = (state) => {
    Mpx.config.rnConfig.onStateChange?.(state)
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
  const appState = reactive({ state: '' })
  // TODO hideReason 暂未完全模拟
  // 0用户退出小程序
  // 1进入其他小程序
  // 2打开原生功能页
  // 3其他
  watch(() => appState.state, (value) => {
    if (value === 'show') {
      let options = global.__mpxEnterOptions || {}
      const navigation = getFocusedNavigation()
      if (navigation) {
        const state = navigation.getState()
        const current = state.routes[state.index]
        options = Object.assign(appState.isLaunch ? { isLaunch: true } : {}, {
          path: current.name,
          query: current.params,
          scene: 0,
          shareTicket: '',
          referrerInfo: {}
        })
      }
      global.__mpxAppCbs.show.forEach((cb) => {
        cb(options)
      })
    } else if (value === 'hide') {
      global.__mpxAppCbs.hide.forEach((cb) => {
        cb({
          reason: appState.hideReason ?? 3
        })
      })
    }
  }, { sync: true })
  const onAppStateChange = (currentState) => {
    const navigation = getFocusedNavigation()
    if (currentState === 'active') {
      appState.isLaunch = false
      appState.state = 'show'
      if (navigation && hasOwn(global.__mpxPageStatusMap, navigation.pageId)) {
        global.__mpxPageStatusMap[navigation.pageId] = 'show'
      }
    } else if (currentState === 'inactive' || currentState === 'background') {
      appState.hideReason = 3
      appState.state = 'hide'
      if (navigation && hasOwn(global.__mpxPageStatusMap, navigation.pageId)) {
        global.__mpxPageStatusMap[navigation.pageId] = 'hide'
      }
    }
  }

  global.__mpxAppLaunched = false
  global.__mpxOptionsMap[currentInject.moduleId] = memo((props) => {
    const firstRef = useRef(true)
    const initialRouteRef = useRef({
      initialRouteName: firstPage,
      initialParams: {}
    })
    if (firstRef.current) {
      // 热启动情况下，app会被销毁重建，将__mpxAppHotLaunched重置保障路由等初始化逻辑正确执行
      global.__mpxAppHotLaunched = false
      // 热启动情况下重置__mpxPagesMap避免页面销毁函数未及时执行时错误地引用到之前的navigation
      global.__mpxPagesMap = {}
      firstRef.current = false
    }
    if (!global.__mpxAppHotLaunched) {
      const { initialRouteName, initialParams } = Mpx.config.rnConfig.parseAppProps?.(props) || {}
      initialRouteRef.current.initialRouteName = initialRouteName || initialRouteRef.current.initialRouteName
      initialRouteRef.current.initialParams = initialParams || initialRouteRef.current.initialParams

      global.__mpxAppOnLaunch = (navigation) => {
        const state = navigation.getState()
        Mpx.config.rnConfig.onStateChange?.(state)
        const current = state.routes[state.index]
        const options = {
          path: current.name,
          query: current.params,
          scene: 0,
          shareTicket: '',
          referrerInfo: {},
          isLaunch: true
        }
        global.__mpxEnterOptions = options
        if (!global.__mpxAppLaunched) {
          global.__mpxLaunchOptions = options
          defaultOptions.onLaunch && defaultOptions.onLaunch.call(appInstance, options)
        }
        appState.isLaunch = true
        appState.state = 'show'
        global.__mpxAppLaunched = true
        global.__mpxAppHotLaunched = true
      }
    }

    useEffect(() => {
      const changeSubscription = ReactNative.AppState.addEventListener('change', (state) => {
        // 外层可能会异常设置此配置，因此加载监听函数内部
        if (Mpx.config.rnConfig.disableReactNativeAppStateChange) return
        onAppStateChange(state)
      })

      let count = 0
      let lastPageSize = getPageSize()
      const resizeSubScription = ReactNative.Dimensions.addEventListener('change', ({ window }) => {
        const pageSize = getPageSize(window)
        if (pageSize === lastPageSize) return
        lastPageSize = pageSize
        const navigation = getFocusedNavigation()
        if (navigation && hasOwn(global.__mpxPageStatusMap, navigation.pageId)) {
          global.__mpxPageStatusMap[navigation.pageId] = `resize${count++}`
        }
      })
      return () => {
        appState.hideReason = 0
        appState.state = 'hide'
        changeSubscription && changeSubscription.remove()
        resizeSubScription && resizeSubScription.remove()
      }
    }, [])

    const { initialRouteName, initialParams } = initialRouteRef.current
    const navScreenOpts = {
      // 7.x替换headerBackTitleVisible
      // headerBackButtonDisplayMode: 'minimal',
      headerBackTitleVisible: false,
      headerShadowVisible: false
      // 整体切换native-stack时进行修改如下
      // statusBarTranslucent: true,
      // statusBarBackgroundColor: 'transparent'
    }
    if (__mpx_mode__ === 'ios') {
      // ios使用native-stack
      const headerBackImageSource = Mpx.config.rnConfig.headerBackImageSource || null
      if (headerBackImageSource) {
        navScreenOpts.headerBackImageSource = headerBackImageSource
      }
    } else {
      // 安卓上会出现导航条闪现的问题所以默认加headerShown false（stack版本， native-stack版本可以干掉）
      // iOS加上默认headerShown false的话会因为iOS根高度是screenHeight - useHeaderHeight()会导致出现渲染两次情况，因此iOS不加此默认值
      navScreenOpts.headerShown = false
      // 安卓和鸿蒙先用stack
      const headerBackImageProps = Mpx.config.rnConfig.headerBackImageProps || null
      if (headerBackImageProps) {
        navScreenOpts.headerBackImage = () => {
          return createElement(ReactNative.Image, headerBackImageProps)
        }
      }
    }

    return createElement(SafeAreaProvider,
      null,
      createElement(NavigationContainer,
        {
          onStateChange,
          onUnhandledAction
        },
        createElement(Stack.Navigator,
          {
            initialRouteName,
            screenOptions: navScreenOpts
          },
          ...getPageScreens(initialRouteName, initialParams)
        )
      )
    )
  })

  global.getCurrentPages = function () {
    const navigation = getFocusedNavigation()
    if (navigation) {
      return navigation.getState().routes.map((route) => {
        return global.__mpxPagesMap[route.key] && global.__mpxPagesMap[route.key][0]
      }).filter(item => item)
    }
    return []
  }

  global.setCurrentPageStatus = function (status) {
    const navigation = getFocusedNavigation()
    if (navigation && hasOwn(global.__mpxPageStatusMap, navigation.pageId)) {
      global.__mpxPageStatusMap[navigation.pageId] = status
    }
  }

  // 用于外层业务用来设置App的展示情况
  global.setAppShow = function () {
    onAppStateChange('active')
  }
  global.setAppHide = function () {
    onAppStateChange('inactive')
  }
}
