import React, { useRef, useEffect, createElement } from 'react';
import * as ReactNative from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RouteContext, IntersectionObserverContext, KeyboardAvoidContext } from './context';
import KeyboardAvoidingView from './KeyboardAvoidingView';
import { PortalHost } from '@react-navigation/native';

export default function PageWrapper({
  children,
  navigation,
  pageId,
  pageConfig = {},
  useHeaderHeight,
  useSafeAreaInsets
}) {
        
    const rootRef = useRef(null)

    useEffect(() => {
        setTimeout(() => {
          rootRef.current?.measureInWindow((x, y, width, height) => {
            navigation.layout = { x, y, width, height }
          })
        }, 100)
    }, [])

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

    return createElement(GestureHandlerRootView, {
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
        createElement(RouteContext.Provider, {
            value: routeContextValRef.current
        },
    )
    )
)
}