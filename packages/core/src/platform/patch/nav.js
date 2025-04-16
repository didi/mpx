import { createElement, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ReactNative from 'react-native'

export function useInnerHeaderHeight (pageconfig) {
  if (pageconfig.navigationStyle === 'custom') {
    return 0
  } else {
    const safeAreaTop = useSafeAreaInsets()?.top || 0
    const headerHeight = __mpx_mode__ === 'ios' ? safeAreaTop + 44 : safeAreaTop + 56
    return headerHeight
  }
}

const styles = ReactNative.StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3
  },
  backButton: {
    position: 'absolute',
    left: 5
  },
  backButtonImage: {
    width: 24,
    height: 24
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold'
  }
})

export function innerNav ({ props, navigation }) {
  const { pageConfig } = props
  const pageConfigTitle = pageConfig.navigationBarTitleText?.trim()
  const headerBackgroundColor = pageConfig.navigationBarBackgroundColor || '#000000'
  const headerTextColor = pageConfig.navigationBarTextStyle || 'white'
  const safeAreaTop = useSafeAreaInsets()?.top || 0
  const headerHeight = useInnerHeaderHeight(pageConfig)
  const [title, setTitle] = useState(pageConfigTitle || '')
  navigation.setTitle = setTitle

  // 假设是栈导航，获取栈的长度
  const stackLength = navigation.getState()?.routes?.length

  const backElement = stackLength > 0
  ? createElement(ReactNative.TouchableOpacity, {
    style: [styles.backButton, { paddingTop: safeAreaTop }],
    onPress: () => { navigation.goBack() }
  }, createElement(ReactNative.Image, {
    source: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAABICAYAAACqT5alAAAA2UlEQVR4nO3bMQrCUBRE0Yla6AYEN2nnBrTL+izcitW3MRDkEUWSvPzJvfCqgMwhZbAppWhNbbIHzB1g9wATERFRVyvpkj1irlpJ5X326D7WHh1hbdFD2CLpLmmftm7kfsEe09aNHFiBrT+wAlt/YAW2/sAKbP2BFdj6Ayuwy+ufz6XPL893krZ//O6iu2n4LT8kndLWTRTo4EC7BDo40C6BDg60S6CDA+0S6OBAuwQ6uNWiD2nrJmoIfU7cNWkR2hbb1UfbY7uuWhGWiIg+a/iHuHmA3QPs3gu4JW9Gan+OJAAAAABJRU5ErkJggg==',
    style: styles.backButtonImage
  }))
  : null

  return createElement(ReactNative.View, {
      style: [styles.header, {
          paddingTop: safeAreaTop,
          height: headerHeight,
          backgroundColor: headerBackgroundColor
        }]
      },
      backElement,
      createElement(ReactNative.Text, {
        style: [styles.title, { color: headerTextColor }]
      }, title)
    )
}
