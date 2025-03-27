import { useRef, createElement, useMemo, useLayoutEffect, useEffect } from 'react'
import * as ReactNative from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useHeaderHeight } from '@react-navigation/elements'
import { RouteContext, IntersectionObserverContext, KeyboardAvoidContext } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context'

import PortalHost from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/portal-host'
import KeyboardAvoidingView from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/KeyboardAvoidingView'
import { hasOwn } from '@mpxjs/utils'
import { del, set } from '../../observer/reactive'

let pageId = 0
function usePageStatus (navigation, pageId, pageStatusMap) {
  navigation.pageId = pageId
  if (!hasOwn(pageStatusMap, pageId)) {
    set(pageStatusMap, pageId, '')
  }
  useEffect(() => {
    const focusSubscription = navigation.addListener('focus', () => {
      pageStatusMap[pageId] = 'show'
    })
    const blurSubscription = navigation.addListener('blur', () => {
      pageStatusMap[pageId] = 'hide'
    })

    return () => {
      focusSubscription()
      blurSubscription()
      del(pageStatusMap, pageId)
    }
  }, [navigation])
}

const { useSafeAreaInsets } = global.__navigationHelper

function PageWrapper ({
  children,
  navigation,
  pageConfig = {},
  route,
  pageStatusMap
}) {
  const rootRef = useRef(null)
  const keyboardAvoidRef = useRef(null)
  const intersectionObservers = useRef({})
  const routeContextValRef = useRef({
    navigation,
    pageId
  })
  console.log('route_____ 测试 route', route, navigation)
  const currentPageId = useMemo(() => ++pageId, [])
  usePageStatus(navigation, currentPageId, pageStatusMap)
  useLayoutEffect(() => {
    const isCustom = pageConfig.navigationStyle === 'custom'
    navigation.setOptions({
      headerShown: !isCustom,
      title: pageConfig.navigationBarTitleText?.trim() || '',
      headerStyle: {
        backgroundColor: pageConfig.navigationBarBackgroundColor || '#000000'
      },
      headerTintColor: pageConfig.navigationBarTextStyle || 'white'
    })

    if (__mpx_mode__ === 'android') {
      ReactNative.StatusBar.setBarStyle(pageConfig.barStyle || 'dark-content')
      ReactNative.StatusBar.setTranslucent(isCustom) // 控制statusbar是否占位
      const color = isCustom ? 'transparent' : pageConfig.statusBarColor
      color && ReactNative.StatusBar.setBackgroundColor(color)
    }
  }, [])

  useEffect(() => {
    setTimeout(() => {
      rootRef.current?.measureInWindow((x, y, width, height) => {
        navigation.layout = { x, y, width, height }
      })
    }, 100)
  }, [])

  navigation.insets = useSafeAreaInsets()

  const withKeyboardAvoidingView = (element) => {
    return createElement(KeyboardAvoidContext.Provider,
      {
        value: keyboardAvoidRef
      },
      createElement(KeyboardAvoidingView,
        {
          style: {
            flex: 1
          },
          contentContainerStyle: {
            flex: 1
          }
        },
        element
      )
    )
  }

  return createElement(GestureHandlerRootView,
    {
      // https://github.com/software-mansion/react-native-reanimated/issues/6639 因存在此问题，iOS在页面上进行定宽来暂时规避
      style: __mpx_mode__ === 'ios' && pageConfig.navigationStyle !== 'custom'
        ? {
          height: ReactNative.Dimensions.get('screen').height - useHeaderHeight()
        }
        : {
          flex: 1
        }
    },
    withKeyboardAvoidingView(
      createElement(ReactNative.View,
        {
          style: {
            flex: 1,
            backgroundColor: pageConfig.backgroundColor || '#fff'
          },
          ref: rootRef
        },
        createElement(RouteContext.Provider,
          {
            value: routeContextValRef.current
          },
          createElement(IntersectionObserverContext.Provider,
            {
              value: intersectionObservers.current
            },
            createElement(PortalHost,
              null,
              createElement(children, {
                navigation,
                route,
                id: currentPageId
              })
            )
          )
        )
      )
    ))
}

PageWrapper.displayName = 'PageWrapper'

export default PageWrapper
