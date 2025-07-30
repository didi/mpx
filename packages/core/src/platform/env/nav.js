import { createElement, useState, useMemo, memo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar, processColor, TouchableWithoutFeedback, Image, View, StyleSheet, Text } from 'react-native'
import Mpx from '../../index'

function convertToHex (color) {
  try {
    const intColor = processColor(color)
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
export function useInnerHeaderHeight (pageconfig) {
  if (pageconfig.navigationStyle === 'custom') {
    return 0
  } else {
    const safeAreaTop = useSafeAreaInsets()?.top || 0
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
// navigationBarTextStyle只支持黑白'white'/'black
const validBarTextStyle = (textStyle) => {
  const textStyleColor = convertToHex(textStyle)
  if (textStyle && [NavColor.White, NavColor.Black].includes(textStyleColor)) {
    return textStyleColor
  } else {
    return NavColor.White
  }
}
export const innerNav = memo(({ pageConfig, navigation }) => {
  const [innerPageConfig, setPageConfig] = useState(pageConfig || {})
  navigation.setPageConfig = (config) => {
    const newConfig = Object.assign({}, innerPageConfig, config)
    setPageConfig(newConfig)
  }
  const isCustom = innerPageConfig.navigationStyle === 'custom'
  const navigationBarTextStyle = useMemo(() => validBarTextStyle(innerPageConfig.navigationBarTextStyle), [innerPageConfig.navigationBarTextStyle])
  // 状态栏的颜色
  const statusBarElement = createElement(StatusBar, {
    translucent: true,
    backgroundColor: 'transparent',
    barStyle: (navigationBarTextStyle === NavColor.White) ? 'light-content' : 'dark-content' // 'default'/'light-content'/'dark-content'
  })

  if (isCustom) return statusBarElement
  const safeAreaTop = useSafeAreaInsets()?.top || 0
  // 假设是栈导航，获取栈的长度
  const stackLength = navigation.getState()?.routes?.length
  const onStackTopBack = Mpx.config?.rnConfig?.onStackTopBack
  const isHandleStackTopBack = typeof onStackTopBack === 'function'

  // 回退按钮与图标
  const backElement = stackLength > 1 || isHandleStackTopBack
    ? createElement(TouchableWithoutFeedback, {
      onPress: () => {
        if (stackLength <= 1 && isHandleStackTopBack) {
          onStackTopBack()
          return
        }
        navigation.goBack()
      }
    }, createElement(View, {
      style: [styles.backButton]
    }, createElement(Image, {
      source: { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAABICAYAAACqT5alAAAA2UlEQVR4nO3bMQrCUBRE0Yla6AYEN2nnBrTL+izcitW3MRDkEUWSvPzJvfCqgMwhZbAppWhNbbIHzB1g9wATERFRVyvpkj1irlpJ5X326D7WHh1hbdFD2CLpLmmftm7kfsEe09aNHFiBrT+wAlt/YAW2/sAKbP2BFdj6Ayuwy+ufz6XPL893krZ//O6iu2n4LT8kndLWTRTo4EC7BDo40C6BDg60S6CDA+0S6OBAuwQ6uNWiD2nrJmoIfU7cNWkR2hbb1UfbY7uuWhGWiIg+a/iHuHmA3QPs3gu4JW9Gan+OJAAAAABJRU5ErkJggg==' },
      // 回退按钮的颜色与设置的title文案颜色一致
      style: [styles.backButtonImage, { tintColor: navigationBarTextStyle }]
    })
    ))
    : null

  return createElement(View, {
    style: [styles.header, {
      paddingTop: safeAreaTop,
      backgroundColor: innerPageConfig.navigationBarBackgroundColor || '#000000'
    }]
  },
    statusBarElement,
    createElement(View, {
      style: styles.headerContent,
      height: titleHeight
    }, backElement,
      createElement(Text, {
        style: [styles.title, { color: navigationBarTextStyle }],
        numberOfLines: 1
      }, innerPageConfig.navigationBarTitleText?.trim() || ''))
  )
})
