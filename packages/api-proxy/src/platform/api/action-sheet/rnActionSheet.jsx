import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { successHandle, failHandle, getCurrentPageId } from '../../../common/js'
import Portal from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index'
import { getWindowInfo } from '../system/rnSystem'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing
} from 'react-native-reanimated'
const actionSheetMap = new Map()

const remove = function (id) {
  if (actionSheetMap.get(id)) { // 页面维度判断是否要清除之前渲染的actionsheet
    Portal.remove(actionSheetMap.get(id))
    actionSheetMap.delete(id)
  }
}

const windowInfo = getWindowInfo()
const bottom = windowInfo.screenHeight - windowInfo.safeArea.bottom

const styles = StyleSheet.create({
  actionAction: {
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
    zIndex: 1000
  },
  maskWrap: {
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    position: 'absolute'
  },
  actionActionMask: {
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'absolute'
  },
  actionSheetContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  itemStyle: {
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  itemTextStyle: {
    fontSize: 18,
    height: 22,
    lineHeight: 22
  },
  buttonStyle: {
    paddingTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: bottom + 10
  }
})

function ActionSheet ({ itemColor, height, success, fail, complete, alertText, itemList }) {
  const slide = useSharedValue(height)
  const fade = useSharedValue(0)
  const [selectedIndex, setSelectedIndex] = useState(null)

  const actionAnimatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: slide.value }]
    }
  })
  const maskAnimatedStyles = useAnimatedStyle(() => {
    return {
      opacity: fade.value
    }
  })

  useEffect(() => {
    fade.value = withTiming(1, {
      easing: Easing.inOut(Easing.poly(3)),
      duration: 250
    })
    slide.value = withTiming(0, {
      easing: Easing.out(Easing.poly(3)),
      duration: 250
    })
  }, [])

  const removeActionSheet = function () {
    const id = getCurrentPageId()
    remove(id)
  }

  const selectAction = function (index) {
    removeActionSheet()
    const result = {
      errMsg: 'showActionSheet:ok',
      tapIndex: index
    }
    successHandle(result, success, complete)
    setSelectedIndex(null)
  }
  const cancelAction = function () {
    removeActionSheet()
    const result = {
      errMsg: 'showActionSheet:fail cancel'
    }
    failHandle(result, fail, complete)
    setSelectedIndex(null)
  }
  const startHandle = function (index) {
    setSelectedIndex(index)
  }
  return (
    <View style={styles.actionAction}>
      <Animated.View style={[styles.maskWrap, maskAnimatedStyles]}>
        <View
          activeOpacity={1}
          style={styles.actionActionMask}
          onTouchEnd={cancelAction}
        ></View>
      </Animated.View>
      <Animated.View
        style={[styles.actionSheetContent, actionAnimatedStyles]}
      >
        {alertText
          ? (
            <View style={styles.itemStyle}>
              <Text
                style={[styles.itemTextStyle, { color: '#666666' }]}
              >
                {alertText}
              </Text>
            </View>
            )
          : null}
        {itemList.map((item, index) => (
          <View
            onTouchStart={() => startHandle(index)}
            onTouchEnd={() => selectAction(index)}
            key={index}
            style={[
              styles.itemStyle,
              itemList.length - 1 === index
                ? {
                    borderBottomWidth: 6,
                    borderBottomStyle: 'solid',
                    borderBottomColor: '#f7f7f7'
                  }
                : {},
              selectedIndex === index
                ? {
                    backgroundColor: '#ececec'
                  }
                : {}
            ]}
          >
            <Text
              style={[styles.itemTextStyle, { color: itemColor }]}
            >
              {item}
            </Text>
          </View>
        ))}
        <View
          style={[
            styles.buttonStyle,
            selectedIndex === -1
              ? {
                  backgroundColor: '#ececec'
                }
              : {}
          ]}
          onTouchStart={() => startHandle(-1)}
          onTouchEnd={cancelAction}
        >
          <Text
            style={{
              color: '#000000',
              fontSize: 18,
              lineHeight: 22,
              height: 22,
              width: '100%',
              textAlign: 'center'
            }}
          >
            取消
          </Text>
        </View>
      </Animated.View>
    </View>
  )
}
function showActionSheet (options = {}) {
  const id = getCurrentPageId()
  remove(id)
  const { alertText, itemList = [], itemColor = '#000000', success, fail, complete } = options
  if (id === null) {
    const result = {
      errMsg: 'showActionSheet:fail cannot be invoked outside the mpx life cycle in React Native environments'
    }
    failHandle(result, fail, complete)
    return
  }
  const len = itemList.length
  if (len > 6) {
    const result = {
      errMsg: 'showActionSheet:fail parameter error: itemList should not be large than 6'
    }
    failHandle(result, fail, complete)
    return
  }
  const height = len * 53 + 46 + bottom + (alertText ? 52 : 0)

  const actionSheetKey = Portal.add(
    <ActionSheet
      itemColor={itemColor}
      height={height}
      success={success}
      fail={fail}
      complete={complete}
      alertText={alertText}
      itemList={itemList}
    />,
    id
  )
  actionSheetMap.set(id, actionSheetKey)
}

export { showActionSheet }
