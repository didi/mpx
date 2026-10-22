import { createElement, useEffect, useMemo, useRef } from 'react'
import * as ReactNative from 'react-native'
import { hasOwn, setFocusedNavigation } from '@mpxjs/utils'
import { IntersectionObserverContext, KeyboardAvoidContext, RouteContext } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context'
import { GestureHandlerRootView, PortalHost, useSafeAreaInsets, initialWindowMetrics } from '../env/navigationHelper'
import MpxNav, { useInnerHeaderHeight } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-nav'

let pageId = 0

function getLayoutData (headerHeight) {
  const screenDimensions = ReactNative.Dimensions.get('screen')
  const windowDimensions = ReactNative.Dimensions.get('window')
  const layoutDimensions = ReactNative.Platform.OS === 'ios' ? windowDimensions : screenDimensions
  // 在横屏状态下 screen.height = window.height + bottomVirtualHeight
  // 在正常状态   screen.height =  window.height + bottomVirtualHeight + statusBarHeight
  const isLandscape = screenDimensions.height < screenDimensions.width
  let bottomVirtualHeight = 0
  if (ReactNative.Platform.OS === 'android') {
    if (isLandscape) {
      bottomVirtualHeight = screenDimensions.height - windowDimensions.height
    } else {
      bottomVirtualHeight = initialWindowMetrics?.insets?.bottom || 0
      if (typeof mpxGlobal.__mpx.config?.rnConfig?.getBottomVirtualHeight === 'function') {
        bottomVirtualHeight = mpxGlobal.__mpx.config?.rnConfig?.getBottomVirtualHeight() || 0
      }
    }
  }
  return {
    left: 0,
    top: headerHeight,
    // 此处必须为windowDimensions.width，在横屏状态下windowDimensions.width才符合预期
    width: windowDimensions.width,
    height: layoutDimensions.height - headerHeight - bottomVirtualHeight,
    // ios为0 android为实际statusbar高度
    statusBarHeight: ReactNative.StatusBar.currentHeight || 0,
    bottomVirtualHeight: bottomVirtualHeight,
    isLandscape: isLandscape
  }
}

let hasResolvedSafeAreaTop = false

function getSafeAreaInsetsWithInitialTop (safeAreaInsets) {
  if (ReactNative.Platform.OS !== 'android' || hasResolvedSafeAreaTop) {
    return safeAreaInsets
  }
  const initialTop = initialWindowMetrics?.insets?.top || 0
  if (safeAreaInsets?.top === 0 && initialTop) {
    // Android 初始化时 top 可能连续为 0（如红米 10 的 bottom 已更新但 top 仍为 0），此时持续兜底并保留其他 insets 的最新值。
    // 返回新对象，避免修改 useSafeAreaInsets/context 返回的引用。
    return Object.assign({}, safeAreaInsets, { top: initialTop })
  } else {
    // 拿到真实 top 或没有可用初始值后，后续完全使用 useSafeAreaInsets 的更新。
    hasResolvedSafeAreaTop = true
  }
  return safeAreaInsets
}

export function pageWrapperHOC (WrappedComponent, pageConfig = {}) {
  return function PageWrapperCom (props) {
    const { navigation, route } = props
    const currentPageId = useMemo(() => ++pageId, [])
    const routeContextValRef = useRef({ navigation, pageId: currentPageId })
    navigation.pageId = currentPageId
    const keyboardAvoidRef = useRef(null)
    const intersectionObservers = useRef({})
    const currentPageConfig = Object.assign({}, global.__mpxPageConfig, pageConfig)
    const headerHeight = useInnerHeaderHeight(currentPageConfig)
    navigation.layout = getLayoutData(headerHeight)
    navigation.insets = getSafeAreaInsetsWithInitialTop(useSafeAreaInsets())

    global.__mpxPagesMap = global.__mpxPagesMap || {}
    if (!hasOwn(global.__mpxPagesMap, route.key)) {
      // 实体页面创建后会填入 instance。
      global.__mpxPagesMap[route.key] = [null, navigation]
      setFocusedNavigation(navigation)
    }
    if (!global.__mpxAppHotLaunched && global.__mpxAppOnLaunch) {
      global.__mpxAppOnLaunch(navigation)
    }

    useEffect(() => {
      const dimensionListener = ReactNative.Dimensions.addEventListener('change', () => {
        navigation.layout = getLayoutData(headerHeight)
      })
      return () => dimensionListener?.remove()
    }, [navigation, headerHeight])

    useEffect(() => {
      return () => {
        const page = global.__mpxPagesMap[route.key]
        if (page && page[0] === null && page[1] === navigation) {
          delete global.__mpxPagesMap[route.key]
        }
      }
    }, [navigation, route.key])

    let content = createElement(ReactNative.View,
      {
        style: {
          flex: 1,
          backgroundColor: currentPageConfig.backgroundColorContent || '#fff',
          // 页面内 relative 元素 left 为负值时，避免回退时透出。
          overflow: 'hidden'
        }
      },
      createElement(RouteContext.Provider,
        { value: routeContextValRef.current },
        createElement(IntersectionObserverContext.Provider,
          { value: intersectionObservers.current },
          createElement(PortalHost, { id: currentPageId }, createElement(WrappedComponent, props))
        )
      )
    )
    if (!currentPageConfig.disableKeyboardAvoiding) {
      const MpxKeyboardAvoidingView = require('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-keyboard-avoiding-view').default
      content = createElement(KeyboardAvoidContext.Provider,
        { value: keyboardAvoidRef },
        createElement(MpxKeyboardAvoidingView,
          { style: { flex: 1 }, contentContainerStyle: { flex: 1 } },
          content
        )
      )
    }
    return createElement(GestureHandlerRootView,
      { style: { flex: 1 } },
      createElement(MpxNav, { pageConfig: currentPageConfig, navigation }),
      content
    )
  }
}
