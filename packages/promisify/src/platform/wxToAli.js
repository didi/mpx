import { changeOpts, handleSuccess, error, warn, info, noop } from '../utils'

const ALI_NAME = my
const ALI_NAME_STRING = 'my'

const wxToAliApi = {
  getSystemInfo (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      res.system = `${res.platform} ${res.system}`

      // 支付宝 windowHeight 可能为 0
      if (!res.windowHeight) {
        res.windowHeight = Math.floor(res.screenHeight * res.windowWidth / res.screenWidth) - 50
      }

      return res
    })

    ALI_NAME.getSystemInfo(opts)
  },

  getSystemInfoSync () {
    let res = ALI_NAME.getSystemInfoSync()

    res.system = `${res.platform} ${res.system}`

    // 支付宝 windowHeight 可能为 0
    if (!res.windowHeight) {
      res.windowHeight = Math.floor(res.screenHeight * res.windowWidth / res.screenWidth) - 50
    }

    return res
  },

  showToast (options) {
    const opts = changeOpts(options, {
      title: 'content',
      icon: 'type'
    })
    ALI_NAME.showToast(opts)
  },

  hideToast (options) {
    if (options.success || options.fail || options.complete) {
      warn(`${ALI_NAME_STRING}.hideToast 不支持 success/fail/complete 参数`)
    }
    ALI_NAME.hideToast(options)
  },

  showModal (options) {
    let opts

    if (options.showCancel === undefined || options.showCancel) {
      opts = changeOpts(options, {
        confirmText: 'confirmButtonText',
        cancelText: 'cancelButtonText'
      })

      handleSuccess(opts, res => {
        return changeOpts(res, undefined, { 'cancel': !res.confirm })
      })

      ALI_NAME.confirm(opts)
    } else {
      opts = changeOpts(options, {
        confirmText: 'buttonText'
      })

      ALI_NAME.alert(opts)
    }
  },

  showLoading (options) {
    const opts = changeOpts(options, {
      title: 'content'
    })
    ALI_NAME.showLoading(opts)
  },

  hideLoading (options) {
    if (options.success || options.fail || options.complete) {
      warn(`${ALI_NAME_STRING}.hideLoading 不支持 success/fail/complete 参数`)
    }
    ALI_NAME.hideLoading(options)
  },

  showActionSheet (options) {
    const opts = changeOpts(options, {
      itemList: 'items'
    })

    const cacheSuc = opts.success || noop
    const cacheFail = opts.fail || noop

    opts.success = res => {
      if (res.index === -1) {
        cacheFail({
          errMsg: 'showActionSheet:fail cancel'
        })
      } else {
        cacheSuc(res)
      }
    }

    ALI_NAME.showActionSheet(opts)
  },

  showNavigationBarLoading (options) {
    if (options.success || options.fail || options.complete) {
      warn(`${ALI_NAME_STRING}.showNavigationBarLoading 不支持 success/fail/complete 参数`)
    }
    ALI_NAME.showNavigationBarLoading(options)
  },

  hideNavigationBarLoading (options) {
    if (options.success || options.fail || options.complete) {
      warn(`${ALI_NAME_STRING}.hideNavigationBarLoading 不支持 success/fail/complete 参数`)
    }
    ALI_NAME.hideNavigationBarLoading(options)
  },

  setNavigationBarTitle (options) {
    ALI_NAME.setNavigationBar(options)
  },

  setNavigationBarColor (options) {
    ALI_NAME.setNavigationBar(options)
  },

  request (options) {
    const opts = changeOpts(options, {
      header: 'headers'
    })

    handleSuccess(opts, res => {
      return changeOpts(res, {
        headers: 'header',
        status: 'statusCode'
      })
    })

    // 钉钉端需要使用 httpRequest
    ALI_NAME.request(opts)
  },

  setStorageSync (key, data) {
    ALI_NAME.setStorageSync({
      key,
      data
    })
  },

  removeStorageSync (key) {
    ALI_NAME.removeStorageSync({
      key
    })
  },

  getStorageSync (key) {
    return ALI_NAME.getStorageSync({
      key
    }).data
  },

  saveImageToPhotosAlbum (key) {
    warn('如果想要保存在线图片链接，可以直接使用 saveImage')
  },

  previewImage (options) {
    const opts = changeOpts(options)

    if (opts.current) {
      let idx = options.urls.indexOf(opts.current)
      opts.current = idx !== -1 ? idx : 0
    }

    ALI_NAME.previewImage(opts)
  },

  compressImage (options) {
    const opts = changeOpts(options, {
      quality: ''
    }, {
      compressLevel: Math.round(options.quality / 100 * 4), // 支付宝图片压缩质量为 0 ~ 4，微信是 0 ~ 100
      apFilePaths: [options.src]
    })

    handleSuccess(opts, res => {
      return changeOpts(
        res,
        { apFilePaths: '' },
        { tempFilePath: res.apFilePaths[0] }
      )
    })

    ALI_NAME.compressImage(opts)
  },

  chooseImage (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePaths: 'tempFilePaths' })
    })

    ALI_NAME.chooseImage(opts)
  },

  getLocation (options) {
    if (options.aliType === undefined) {
      info(`如果要设置支付宝 ${ALI_NAME_STRING}.getLocation 中的 type 参数，请使用 aliType, 取值为 0~3`)
    }
    if (options.altitude) {
      warn(`支付宝 ${ALI_NAME_STRING}.getLocation 不支持获取高度信息`)
    }

    const opts = changeOpts(options, {
      type: '',
      aliType: 'type'
    })

    ALI_NAME.getLocation(opts)
  },

  saveFile (options) {
    const opts = changeOpts(options, {
      tempFilePath: 'apFilePath'
    })

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePath: 'savedFilePath' })
    })

    ALI_NAME.saveFile(opts)
  },

  removeSavedFile (options) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePath: 'savedFilePath' })
    })

    ALI_NAME.removeSavedFile(opts)
  },

  getSavedFileList (options) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    handleSuccess(opts, res => {
      if (res.fileList) {
        res.fileList.forEach(file => {
          let resFile = changeOpts(file, {
            apFilePath: 'filePath'
          })
          file = resFile
        })
      }
      return res
    })

    ALI_NAME.getSavedFileList(opts)
  },

  getSavedFileInfo (options) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    ALI_NAME.getSavedFileInfo(opts)
  },

  getFileInfo (options) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    ALI_NAME.getFileInfo(opts)
  },

  addPhoneContact (options) {
    const opts = changeOpts(options, {
      weChatNumber: 'alipayAccount'
    })

    ALI_NAME.addPhoneContact(opts)
  },

  setClipboardData (options) {
    const opts = changeOpts(options, {
      data: 'text'
    })

    ALI_NAME.setClipboard(opts)
  },

  getClipboardData (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { text: 'data' })
    })

    ALI_NAME.getClipboard(opts)
  },

  setScreenBrightness (options) {
    const opts = changeOpts(options, {
      value: 'brightness'
    })

    ALI_NAME.setScreenBrightness(opts)
  },

  getScreenBrightness (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { brightness: 'value' })
    })

    ALI_NAME.getScreenBrightness(opts)
  },

  makePhoneCall (options) {
    const opts = changeOpts(options, {
      phoneNumber: 'number'
    })

    ALI_NAME.makePhoneCall(opts)
  },

  stopAccelerometer (options) {
    ALI_NAME.offAccelerometerChange(options)
  },

  startAccelerometer () {
    info(`支付宝加速计不需要使用 ${ALI_NAME_STRING}.startAccelerometer 开始，可以直接在 ${ALI_NAME_STRING}.onAccelerometerChange 中监听`)
  },

  stopCompass (options) {
    ALI_NAME.offCompassChange(options)
  },

  startCompass () {
    info(`支付宝罗盘不需要使用 ${ALI_NAME_STRING}.startCompass 开始，可以直接在 ${ALI_NAME_STRING}.onCompassChange 中监听`)
  },

  stopGyroscope (options) {
    ALI_NAME.offGyroscopeChange(options)
  },

  startGyroscope () {
    info(`支付宝陀螺仪不需要使用 ${ALI_NAME_STRING}.startGyroscope 开始，可以直接在 ${ALI_NAME_STRING}.onGyroscopeChange 中监听`)
  },

  scanCode (options) {
    const opts = changeOpts(options, {
      onlyFromCamera: 'hideAlbum',
      scanType: 'type'
    })

    if (opts.type) {
      switch (opts.type) {
        case 'barCode':
          opts.type = 'bar'
          break
        case 'qrCode':
          opts.type = 'qr'
          break
        default:
          warn(`${ALI_NAME_STRING}.scanCode 只支持扫描条形码和二维码，请将 type 设置为 barCode/qrCode`)
          break
      }
    }

    handleSuccess(opts, res => {
      return changeOpts(res, { code: 'result' })
    })

    ALI_NAME.scan(opts)
  },

  login (options) {
    let opts

    if (!options.scopes) {
      opts = changeOpts(options, undefined, { scopes: 'auth_user' })
    } else {
      opts = changeOpts(options)
    }

    handleSuccess(opts, res => {
      return changeOpts(res, { authCode: 'code' })
    })

    ALI_NAME.getAuthCode(opts)
  },

  checkSession () {
    warn(`支付宝不支持检查登录过期函数 checkSession`)
  },

  getUserInfo (options) {
    if (options.withCredentials === true) {
      warn(`支付宝不支持在 getUserInfo 使用 withCredentials 参数中获取等敏感信息`)
    }
    if (options.lang) {
      info(`支付宝不支持在 getUserInfo 中使用 lang 参数`)
    }

    let opts = changeOpts(options)

    handleSuccess(opts, res => {
      let userInfo = changeOpts(res, { avatar: 'avatarUrl' }, { gender: 0 })
      const params = ['country', 'province', 'city', 'language']

      params.forEach(key => {
        Object.defineProperty(userInfo, key, {
          get () {
            warn(`支付宝 getUserInfo 不能获取 ${key}`)
            return ''
          }
        })
      })

      return {
        userInfo
      }
    })

    ALI_NAME.getAuthUserInfo(opts)
  },

  requestPayment (options) {
    if (!options.tradeNO) {
      error('请在支付函数 requestPayment 中添加 tradeNO 参数用于支付宝支付')
    }

    let opts = changeOpts(options, {
      timeStamp: '',
      nonceStr: '',
      package: '',
      signType: '',
      paySign: ''
    })

    const cacheSuc = opts.success || noop
    const cacheFail = opts.fail || noop

    opts.success = res => {
      if (res.resultCode === 9000) {
        cacheSuc(res)
      } else {
        cacheFail(res)
      }
    }

    ALI_NAME.tradePay(opts)
  }
}

/**
 * @param {Object} target 要代理的对象
 */
const proxyWxToAliApi = target => {
  Object.keys(wxToAliApi).forEach(api => {
    target[api] = wxToAliApi[api]
  })
}

export {
  wxToAliApi,
  proxyWxToAliApi
}
