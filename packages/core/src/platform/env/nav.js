import { createElement, useState, useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ReactNative from 'react-native'
import Mpx from '../../index'

export function useInnerHeaderHeight (pageconfig) {
  if (pageconfig.navigationStyle === 'custom') {
    return 0
  } else {
    const safeAreaTop = useSafeAreaInsets()?.top || 0
    const headerHeight = safeAreaTop + getTitleHeight()
    return headerHeight
  }
}

// 固定写死高度
function getTitleHeight () {
  return 44
}

// 计算颜色亮度
const getColorBrightness = (color) => {
  const processedColor = ReactNative.processColor(color)
  if (typeof processedColor === 'number') {
      const r = (processedColor >> 16) & 255
      const g = (processedColor >> 8) & 255
      const b = processedColor & 255
      return (r * 299 + g * 587 + b * 114) / 1000
  }
  return 0
}

const styles = ReactNative.StyleSheet.create({
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
export function innerNav ({ props, navigation }) {
  const { pageConfig } = props
  const [innerPageConfig, setPageConfig] = useState(pageConfig || {})
  navigation.setPageConfig = (config) => {
    const newConfig = Object.assign({}, innerPageConfig, config)
    setPageConfig(newConfig)
  }

  const isCustom = innerPageConfig.navigationStyle === 'custom'
  if (isCustom) return null
  const safeAreaTop = useSafeAreaInsets()?.top || 0

  // 回退按钮的颜色，根据背景色的亮度来进行调节
  const backButtonColor = useMemo(() => {
    return getColorBrightness(innerPageConfig.navigationBarBackgroundColor) > 128 ? '#000000' : '#ffffff'
  }, [innerPageConfig.navigationBarBackgroundColor])

  // 假设是栈导航，获取栈的长度
  const stackLength = navigation.getState()?.routes?.length
  // 用于外部注册打开RN容器之前的栈长度
  const beforeStackLength = Mpx.config?.rnConfig?.beforeStackLength || 0

  // 回退按钮与图标
  const backElement = stackLength + beforeStackLength > 1
  ? createElement(ReactNative.TouchableOpacity, {
    style: [styles.backButton],
    onPress: () => { navigation.goBack() }
  }, createElement(ReactNative.Image, {
    source: { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAABICAYAAACqT5alAAAA2UlEQVR4nO3bMQrCUBRE0Yla6AYEN2nnBrTL+izcitW3MRDkEUWSvPzJvfCqgMwhZbAppWhNbbIHzB1g9wATERFRVyvpkj1irlpJ5X326D7WHh1hbdFD2CLpLmmftm7kfsEe09aNHFiBrT+wAlt/YAW2/sAKbP2BFdj6Ayuwy+ufz6XPL893krZ//O6iu2n4LT8kndLWTRTo4EC7BDo40C6BDg60S6CDA+0S6OBAuwQ6uNWiD2nrJmoIfU7cNWkR2hbb1UfbY7uuWhGWiIg+a/iHuHmA3QPs3gu4JW9Gan+OJAAAAABJRU5ErkJggg==' },
    style: [styles.backButtonImage, { tintColor: backButtonColor }]
  }))
  : null

  return createElement(ReactNative.View, {
      style: [styles.header, {
          paddingTop: safeAreaTop,
          backgroundColor: innerPageConfig.navigationBarBackgroundColor || '#000000'
        }]
      },
      createElement(ReactNative.View, {
        style: styles.headerContent,
        height: getTitleHeight()
      }, backElement,
      createElement(ReactNative.Text, {
        style: [styles.title, { color: innerPageConfig.navigationBarTextStyle || 'white' }],
        numberOfLines: 1
      }, innerPageConfig.navigationBarTitleText?.trim() || ''))
    )
}
