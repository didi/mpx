import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native'
import { successHandle, failHandle } from '../../../common/js'
import RootSiblings from 'react-native-root-siblings'
import successPng from './success.png'
import errorPng from './error.png'

let rootSiblingsObj
let isLoading
const styles = StyleSheet.create({
  toastContent: {
    minWdth: 150,
    maxWidth: '60%',
    backgroundColor: 'rgba(20, 20, 20, 0.7)',
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  toastWrap: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 10000,
    position: "absolute",
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  toastImg: {
    width: 40,
    height: 40,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 10
  },
  toastText: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 18,
    height: 18,
    overflow: 'hidden'
  }
})
function showToast (options) {
  const { title, icon = 'success', image, duration = 1500, mask = false, success, fail, complete, isShowLoading } = options
  let ToastView
  const iconImg = {
    success: successPng,
    fail: errorPng
  }
  const pointerEvents = mask ? 'auto' : 'none'
  isLoading = isShowLoading
  if (image || icon === 'success' || icon === 'error') {
    ToastView = <View style={styles.toastWrap} pointerEvents={pointerEvents}>
      <View style={styles.toastContent}>
        <Image source={image || iconImg[icon]} style={styles.toastImg}></Image>
        <Text style={styles.toastText}>{title}</Text>
      </View>
    </View>
  } else if (icon === 'loading') {
    ToastView = <View style={styles.toastWrap} pointerEvents={pointerEvents}>
      <View style={styles.toastContent}>
        <ActivityIndicator
          animating
          style={{ marginBottom: 10 }}
          size='small'
          color='#eee'
        />
        <Text style={styles.toastText}>{title}</Text>
      </View>
    </View>
  }  else  {
    ToastView = <View style={styles.toastWrap} pointerEvents={pointerEvents}>
      <View style={styles.toastContent}>
        <Text numberOfLines={2} style={{ ...styles.toastText, ...(icon === 'none' ? {
            height: 36
          } : {}) }}>{title}</Text>
      </View>
    </View>
  }
  try {
    if (!rootSiblingsObj) {
      rootSiblingsObj = new RootSiblings(ToastView)
    } else {
      rootSiblingsObj.destroy()
      rootSiblingsObj.update(ToastView)
    }
    if (!isShowLoading) {
      setTimeout(() => {
        rootSiblingsObj && rootSiblingsObj.destroy()
      }, duration)
    }
    const result = {
      errMsg: 'showToast:ok'
    }
    successHandle(result, success, complete)
  } catch (e) {
    const result = {
      errMsg: `showToast:fail invalid ${e}`
    }
    failHandle(result, fail, complete)
  }
}

function hideToast(options) {
  const { success, fail, complete } = options
  try {
    if (rootSiblingsObj) {
      rootSiblingsObj.destroy()
    }
    const result = {
      errMsg: 'hideToast:ok'
    }
    successHandle(result, success, complete)
  } catch (e) {
    const result = {
      errMsg: `hideToast:fail invalid ${e}`
    }
    failHandle(result, fail, complete)
  }
}

function showLoading (options) {
  if (isLoading) {
    return
  }
  const { title, mask, success, fail, complete } = options
  showToast({
    title,
    mask,
    icon: 'loading',
    isShowLoading: true,
    success () {
      const result = {
        errMsg: 'showLoading:ok'
      }
      successHandle(result, success, complete)
    },
    fail (res) {
      const result = {
        errMsg: res.errMsg.replace('showToast', 'showLoading')
      }
      failHandle(result, success, complete)
    }
  })
}

function hideLoading (options) {
  if (!isLoading) {
    return
  }
  isLoading = false
  const { success, fail, complete } = options
  try {
    if (rootSiblingsObj) {
      rootSiblingsObj.destroy()
    }
    const result = {
      errMsg: 'hideLoading:ok'
    }
    successHandle(result, success, complete)
  } catch (e) {
    const result = {
      errMsg: `hideLoading:fail invalid ${e}`
    }
    failHandle(result, fail, complete)
  }
}

export {
  showToast,
  hideToast,
  showLoading,
  hideLoading
}
