/* eslint-disable space-before-function-paren */
import { createElement, useState, useMemo, memo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar, processColor, TouchableWithoutFeedback, Image, View, StyleSheet, Text } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'

function convertToHex(color?: string) {
  try {
    const intColor = processColor(color) as number | null | undefined
    if (intColor === null || intColor === undefined) {
      return null
    }
    // 将32位整数颜色值转换为RGBA
    const r = (intColor >> 16) & 255
    const g = (intColor >> 8) & 255
    const b = intColor & 255
    // 转换为十六进制
    const hexR = r.toString(16).padStart(2, '0')
    const hexG = g.toString(16).padStart(2, '0')
    const hexB = b.toString(16).padStart(2, '0')
    return `#${hexR}${hexG}${hexB}`
  } catch (error) {
    return null
  }
}

const titleHeight = 44
export function useInnerHeaderHeight(pageConfig: PageConfig) {
  const safeArea = useSafeAreaInsets()
  if (pageConfig.navigationStyle === 'custom') {
    return 0
  } else {
    const safeAreaTop = safeArea?.top || 0
    const headerHeight = safeAreaTop + titleHeight
    return headerHeight
  }
}

const styles = StyleSheet.create({
  header: {
    elevation: 3
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButton: {
    position: 'absolute',
    height: '100%',
    width: 40,
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButtonImage: {
    width: 22,
    height: 22
  },
  title: {
    fontSize: 17,
    fontWeight: 600,
    width: '60%',
    textAlign: 'center'
  }
})
const NavColor = {
  White: '#ffffff',
  Black: '#000000'
}
// navigationBarTextStyle 只支持黑白 'white'/'black
const validBarTextStyle = (textStyle?: string) => {
  const textStyleColor = convertToHex(textStyle)
  if (textStyle && textStyleColor && [NavColor.White, NavColor.Black].includes(textStyleColor)) {
    return textStyleColor
  } else {
    return NavColor.White
  }
}

export interface MpxNavProps {
  pageConfig: PageConfig
  navigation: any
}

export interface MpxNavFactorOptions {
  Mpx: any
}

const BACK_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAABICAYAAACqT5alAAAA2UlEQVR4nO3bMQrCUBRE0Yla6AYEN2nnBrTL+izcitW3MRDkEUWSvPzJvfCqgMwhZbAppWhNbbIHzB1g9wATERFRVyvpkj1irlpJ5X326D7WHh1hbdFD2CLpLmmftm7kfsEe09aNHFiBrT+wAlt/YAW2/sAKbP2BFdj6Ayuwy+ufz6XPL893krZ//O6iu2n4LT8kndLWTRTo4EC7BDo40C6BDg60S6CDA+0S6OBAuwQ6uNWiD2nrJmoIfU7cNWkR2hbb1UfbY7uuWhGWiIg+a/iHuHmA3QPs3gu4JW9Gan+OJAAAAABJRU5ErkJggg=='

function createMpxNav(options: MpxNavFactorOptions) {
  const { Mpx } = options
  const innerNav = memo(({ pageConfig, navigation }: MpxNavProps) => {
    const [innerPageConfig, setPageConfig] = useState<PageConfig>(pageConfig || {})

    const translateY = useSharedValue(0)
    const safeAreaTop = useSafeAreaInsets()?.top || 0

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }]
    }))

    navigation.setPageConfig = (config: PageConfig) => {
      const newConfig = Object.assign({}, innerPageConfig, config)
      translateY.value =
        newConfig?.animatedNavStyle?.top ?? withTiming(0, { duration: 100, easing: Easing.in(Easing.bezierFn(0.51, 1.18, 0.97, 0.94)) })
      setPageConfig(newConfig)
    }
    const isCustom = innerPageConfig.navigationStyle === 'custom'
    const navigationBarTextStyle = useMemo(() => validBarTextStyle(innerPageConfig.navigationBarTextStyle), [innerPageConfig.navigationBarTextStyle])
    // 状态栏的颜色
    const statusBarElement = (
      <StatusBar
        translucent
        backgroundColor='transparent'
        barStyle={navigationBarTextStyle === NavColor.White ? 'light-content' : 'dark-content'}></StatusBar>
    )
    createElement(StatusBar, {
      translucent: true,
      backgroundColor: 'transparent',
      barStyle: navigationBarTextStyle === NavColor.White ? 'light-content' : 'dark-content' // 'default'/'light-content'/'dark-content'
    })

    if (isCustom) return statusBarElement
    // 假设是栈导航，获取栈的长度
    const stackLength = navigation.getState()?.routes?.length
    const onStackTopBack = Mpx.config?.rnConfig?.onStackTopBack
    const isHandleStackTopBack = typeof onStackTopBack === 'function'

    // 回退按钮与图标
    // prettier-ignore
    const backElement = stackLength > 1 || isHandleStackTopBack
      ? (
        <TouchableWithoutFeedback
          onPress={() => {
            if (stackLength <= 1 && isHandleStackTopBack) {
              onStackTopBack()
              return
            }
            navigation.goBack()
          }}>
          <View style={[styles.backButton]}>
            <Image style={[styles.backButtonImage, { tintColor: navigationBarTextStyle }]} source={{ uri: BACK_ICON }}></Image>
          </View>
        </TouchableWithoutFeedback>
        )
      : null

    return (
      // 不设置 zIndex transform 无法生效
      <Animated.View style={[{ position: 'relative', zIndex: 10000 }, animatedStyle]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: safeAreaTop,
              backgroundColor: innerPageConfig.navigationBarBackgroundColor || '#000000'
            }
          ]}>
          {statusBarElement}
          {/* TODO: 确定 height 的有效性 */}
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-expect-error */}
          <View style={styles.headerContent} height={titleHeight}>
            {backElement}
            <Text style={[styles.title, { color: navigationBarTextStyle }]} numberOfLines={1}>
              {innerPageConfig.navigationBarTitleText?.trim() || ''}
            </Text>
          </View>
        </View>
      </Animated.View>
    )

    // return createElement(
    //   Animated.View,
    //   {
    //     style: [animatedStyle]
    //   },
    //   createElement(
    //     View,
    //     {
    //       style: [
    //         styles.header,
    //         {
    //           paddingTop: safeAreaTop,
    //           backgroundColor: innerPageConfig.navigationBarBackgroundColor || '#000000'
    //         },
    //         innerPageConfig.navStyle ?? {}
    //       ]
    //     },
    //     statusBarElement,
    //     createElement(
    //       View,
    //       {
    //         style: styles.headerContent,
    //         height: titleHeight
    //       },
    //       backElement,
    //       createElement(
    //         Text,
    //         {
    //           style: [styles.title, { color: navigationBarTextStyle }],
    //           numberOfLines: 1
    //         },
    //         innerPageConfig.navigationBarTitleText?.trim() || ''
    //       )
    //     )
    //   )
    // )
  })

  innerNav.displayName = 'MpxNav'
  return innerNav
}

export default createMpxNav
