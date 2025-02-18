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
function showActionSheet (options = {}) {
  const id = getCurrentPageId()
  const remove = function () {
    if (actionSheetMap.get(id)) { // 页面维度判断是否要清除之前渲染的actionsheet
      Portal.remove(actionSheetMap.get(id))
      actionSheetMap.delete(id)
    }
  }
  remove()
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
  const windowInfo = getWindowInfo()
  const bottom = windowInfo.screenHeight - windowInfo.safeArea.bottom
  const height = len * 53 + 46 + bottom + (alertText ? 52 : 0)
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
      right: 0,
      paddingBottom: bottom
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
      paddingBottom: 10,
      justifyContent: 'center',
      alignItems: 'center'
    }
  })
  function ActionSheet () {
    const slide = useSharedValue(height)
    const fade = useSharedValue(0)

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
    const setSlide = function (value) {
      slide.value = withTiming(value, {
        easing: Easing.out(Easing.poly(3)),
        duration: 250
      })
    }

    const setFade = function (value) {
      fade.value = withTiming(value, {
        easing: Easing.inOut(Easing.poly(3)),
        duration: 250
      })
    }
    setSlide(0)
    setFade(1)
    

    const removeAnimation = function () {
      setSlide(height)
      setFade(0)
      setTimeout(() => {
        remove()
      }, 250)
    }

    const selectAction = function (index) {
      const result = {
        errMsg: 'showActionSheet:ok',
        tapIndex: index
      }
      successHandle(result, success, complete)
      removeAnimation()
    }

    const cancelAction = function () {
      const result = {
        errMsg: 'showActionSheet:fail cancel'
      }
      failHandle(result, fail, complete)
      removeAnimation()
    }
    return (
      <View style={styles.actionAction}>
        <Animated.View style={[styles.maskWrap, maskAnimatedStyles]}>
          <View activeOpacity={1} style={styles.actionActionMask} onTouchEnd={cancelAction}></View>
        </Animated.View>
        <Animated.View style={[styles.actionSheetContent, actionAnimatedStyles]}>
          { alertText ? <View style={ styles.itemStyle }><Text style={[styles.itemTextStyle, { color: '#666666' }]}>{alertText}</Text></View> : null }
          { itemList.map((item, index) => <View onTouchEnd={() => selectAction(index)} key={index} style={ [styles.itemStyle, itemList.length -1 === index ? {
            borderBottomWidth: 6,
            borderBottomStyle: 'solid',
            borderBottomColor: '#f7f7f7'
          } : {}] }><Text style={[styles.itemTextStyle, { color: itemColor }]}>{item}</Text></View>) }
          <View style={styles.buttonStyle} onTouchEnd={cancelAction}><Text style={{ color: "#000000", fontSize: 18, lineHeight: 22, height: 22, width: "100%", textAlign: "center" }}>取消</Text></View>
        </Animated.View>
      </View>
    )
  }
  const actionSheetKey = Portal.add(<ActionSheet />, id)
  actionSheetMap.set(id, actionSheetKey)
}

export {
  showActionSheet
}
