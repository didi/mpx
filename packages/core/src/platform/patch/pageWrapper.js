import { useRef, createElement } from 'react';
import * as ReactNative from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useHeaderHeight } from '@react-navigation/elements'
import { RouteContext, IntersectionObserverContext, KeyboardAvoidContext } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context'

import PortalHost from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/portal-host'
import KeyboardAvoidingView from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/KeyboardAvoidingView'

function PageWrapper ({
    children,
    navigation,
    pageId,
    pageConfig = {}
}) {

    const rootRef = useRef(null)
    const keyboardAvoidRef= useRef(null)
    const intersectionObservers = useRef({})
    const routeContextValRef = useRef({
        navigation,
        pageId
    })

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
                            children
                        )
                    )
                )
            )
        ))
}

PageWrapper.displayName = 'PageWrapper'

export default PageWrapper
