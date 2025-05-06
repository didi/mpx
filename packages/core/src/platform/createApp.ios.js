import transferOptions from '../core/transferOptions'
import builtInKeysMap from './patch/builtInKeysMap'
import { makeMap, spreadProp, getFocusedNavigation, hasOwn } from '@mpxjs/utils'
import { mergeLifecycle } from '../convertor/mergeLifecycle'
import { LIFECYCLE } from '../platform/patch/lifecycle/index'
import Mpx from '../index'
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
  mpxGlobal.getApp = function () {
    return appData
  }

  // 模拟小程序appInstance在热启动时不会重新创建的行为，在外部创建跟随js context的appInstance
  const appInstance = Object.assign({}, appData, Mpx.prototype)

  defaultOptions.onShow && mpxGlobal.__mpxAppCbs.show.push(defaultOptions.onShow.bind(appInstance))
  defaultOptions.onHide && mpxGlobal.__mpxAppCbs.hide.push(defaultOptions.onHide.bind(appInstance))
  defaultOptions.onError && mpxGlobal.__mpxAppCbs.error.push(defaultOptions.onError.bind(appInstance))
  defaultOptions.onUnhandledRejection && mpxGlobal.__mpxAppCbs.rejection.push(defaultOptions.onUnhandledRejection.bind(appInstance))
  defaultOptions.onAppInit && defaultOptions.onAppInit()

  const pages = currentInject.getPages() || {}
  const firstPage = currentInject.firstPage
  const Stack = createStackNavigator()
  const getPageScreens = (initialRouteName, initialParams) => {
    return Object.entries(pages).map(([key, item]) => {
      const options = {
        // __mpxPageStatusMap 为编译注入的全局变量
        headerShown: !(Object.assign({}, mpxGlobal.__mpxPageConfig, mpxGlobal.__mpxPageConfigsMap[key]).navigationStyle === 'custom')
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
  mpxGlobal.__mpxOptionsMap = mpxGlobal.__mpxOptionsMap || {}
  const onStateChange = (state) => {
    Mpx.config.rnConfig.onStateChange?.(state)
    if (mpxGlobal.__navigationHelper.lastSuccessCallback) {
      mpxGlobal.__navigationHelper.lastSuccessCallback()
      mpxGlobal.__navigationHelper.lastSuccessCallback = null
    }
  }
  const onUnhandledAction = (action) => {
    const payload = action.payload
    const message = `The action '${action.type}'${payload ? ` with payload ${JSON.stringify(action.payload)}` : ''} was not handled by any navigator.`
    if (mpxGlobal.__navigationHelper.lastFailCallback) {
      mpxGlobal.__navigationHelper.lastFailCallback(message)
      mpxGlobal.__navigationHelper.lastFailCallback = null
    }
  }

  mpxGlobal.__mpxAppLaunched = false
  mpxGlobal.__mpxOptionsMap[currentInject.moduleId] = memo((props) => {
    const firstRef = useRef(true)
    const initialRouteRef = useRef({
      initialRouteName: firstPage,
      initialParams: {}
    })
    if (firstRef.current) {
      // 热启动情况下，app会被销毁重建，将__mpxAppHotLaunched重置保障路由等初始化逻辑正确执行
      mpxGlobal.__mpxAppHotLaunched = false
      // 热启动情况下重置__mpxPagesMap避免页面销毁函数未及时执行时错误地引用到之前的navigation
      mpxGlobal.__mpxPagesMap = {}
      firstRef.current = false
    }
    if (!mpxGlobal.__mpxAppHotLaunched) {
      const { initialRouteName, initialParams } = Mpx.config.rnConfig.parseAppProps?.(props) || {}
      initialRouteRef.current.initialRouteName = initialRouteName || initialRouteRef.current.initialRouteName
      initialRouteRef.current.initialParams = initialParams || initialRouteRef.current.initialParams

      mpxGlobal.__mpxAppOnLaunch = (navigation) => {
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
        mpxGlobal.__mpxEnterOptions = options
        if (!mpxGlobal.__mpxAppLaunched) {
          mpxGlobal.__mpxLaunchOptions = options
          defaultOptions.onLaunch && defaultOptions.onLaunch.call(appInstance, options)
        }
        mpxGlobal.__mpxAppCbs.show.forEach((cb) => {
          cb(options)
        })
        mpxGlobal.__mpxAppLaunched = true
        mpxGlobal.__mpxAppHotLaunched = true
      }
    }

    useEffect(() => {
      const changeSubscription = ReactNative.AppState.addEventListener('change', (currentState) => {
        if (currentState === 'active') {
          let options = mpxGlobal.__mpxEnterOptions || {}
          const navigation = getFocusedNavigation()
          if (navigation) {
            const state = navigation.getState()
            const current = state.routes[state.index]
            options = {
              path: current.name,
              query: current.params,
              scene: 0,
              shareTicket: '',
              referrerInfo: {}
            }
          }
          mpxGlobal.__mpxAppCbs.show.forEach((cb) => {
            cb(options)
          })
          if (navigation && hasOwn(mpxGlobal.__mpxPageStatusMap, navigation.pageId)) {
            mpxGlobal.__mpxPageStatusMap[navigation.pageId] = 'show'
          }
        } else if (currentState === 'inactive' || currentState === 'background') {
          mpxGlobal.__mpxAppCbs.hide.forEach((cb) => {
            cb({
              reason: 3
            })
          })
          const navigation = getFocusedNavigation()
          if (navigation && hasOwn(mpxGlobal.__mpxPageStatusMap, navigation.pageId)) {
            mpxGlobal.__mpxPageStatusMap[navigation.pageId] = 'hide'
          }
        }
      })

      let count = 0
      let lastPageSize = getPageSize()
      const resizeSubScription = ReactNative.Dimensions.addEventListener('change', ({ window }) => {
        const pageSize = getPageSize(window)
        if (pageSize === lastPageSize) return
        lastPageSize = pageSize
        const navigation = getFocusedNavigation()
        if (navigation && hasOwn(mpxGlobal.__mpxPageStatusMap, navigation.pageId)) {
          mpxGlobal.__mpxPageStatusMap[navigation.pageId] = `resize${count++}`
        }
      })
      return () => {
        // todo 跳到原生页面或者其他rn bundle可以考虑使用reason 1/2进行模拟抹平
        mpxGlobal.__mpxAppCbs.hide.forEach((cb) => {
          cb({
            reason: 0
          })
        })
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

  mpxGlobal.getCurrentPages = function () {
    const navigation = getFocusedNavigation()
    if (navigation) {
      return navigation.getState().routes.map((route) => {
        return mpxGlobal.__mpxPagesMap[route.key] && mpxGlobal.__mpxPagesMap[route.key][0]
      }).filter(item => item)
    }
    return []
  }

  mpxGlobal.setCurrentPageStatus = function (status) {
    const navigation = getFocusedNavigation()
    if (navigation && hasOwn(mpxGlobal.__mpxPageStatusMap, navigation.pageId)) {
      mpxGlobal.__mpxPageStatusMap[navigation.pageId] = status
    }
  }
}
