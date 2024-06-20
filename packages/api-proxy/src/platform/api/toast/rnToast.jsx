import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native'
import { webHandleSuccess, webHandleFail } from '../../../common/js'
import RootSiblings from 'react-native-root-siblings'
import successPng from './success.png'
import errorPng from './error.png'

let rootSiblingsObj
let isLoading
const styles = StyleSheet.create({
  noMaskContent: {
    width: 150,
    height: 100,
    backgroundColor: 'rgba(20, 20, 20, 0.7)',
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 5,
    top: '50%',
    left: '50%',
    zIndex: 10000,
    position: 'absolute',
    marginLeft: -75,
    marginTop: -50,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  toastContent: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 10000,
    position: "absolute"
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
    width: 100,
    fontSize: 14,
    lineHeight: 18,
    height: 18,
    overflow: 'hidden'
  }
})
function showToast (options) {
  const { title, icon, image, duration = 1500, mask = false, success, fail, complete, isShowLoading } = options
  let ToastView
  const iconImg = {
    success: successPng,
    fail: errorPng
  }
  isLoading = isShowLoading
  if (image || icon === 'success' || icon === 'error') {
    ToastView = <View style={mask ? styles.toastContent : styles.noMaskContent}>
      <View style={mask ? styles.noMaskContent : {}}>
        <Image source={image || iconImg[icon]} style={styles.toastImg}></Image>
        <Text style={styles.toastText}>{title}</Text>
      </View>
    </View>
  } else if (icon === 'loading') {
    ToastView = <View style={mask ? styles.toastContent : styles.noMaskContent}>
      <View style={mask ? styles.noMaskContent : {}}>
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
    ToastView = <View style={mask ? styles.toastContent : styles.noMaskContent}>
      <View style={mask ? styles.noMaskContent : {}}>
        <Text style={{ ...styles.toastText, ...(icon === 'none' ? {
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
    webHandleSuccess(result, success, complete)
  } catch (e) {
    const result = {
      errMsg: `showToast:fail invalid ${e}`
    }
    webHandleSuccess(result, fail, complete)
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
    webHandleSuccess(result, success, complete)
  } catch (e) {
    const result = {
      errMsg: `hideToast:fail invalid ${e}`
    }
    webHandleSuccess(result, fail, complete)
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
      webHandleSuccess(result, success, complete)
    },
    fail (res) {
      const result = {
        errMsg: res.errMsg.replace('showToast', 'showLoading')
      }
      webHandleSuccess(result, success, complete)
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
    webHandleSuccess(result, success, complete)
  } catch (e) {
    const result = {
      errMsg: `hideLoading:fail invalid ${e}`
    }
    webHandleSuccess(result, fail, complete)
  }
}

export {
  showToast,
  hideToast,
  showLoading,
  hideLoading
}
