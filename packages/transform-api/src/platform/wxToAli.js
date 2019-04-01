import { changeOpts, handleSuccess, error, warn, info, noop } from '../utils'

const ALI_NAME = my
const ALI_NAME_CACHE = {}
const ALI_NAME_STRING = 'my'

// canvas api 用
const CANVAS_MAP = {}

Object.keys(ALI_NAME).forEach((key) => {
  ALI_NAME_CACHE[key] = ALI_NAME[key]
})

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

    ALI_NAME_CACHE.getSystemInfo.call(ALI_NAME, opts)
  },

  getSystemInfoSync () {
    let res = ALI_NAME_CACHE.getSystemInfoSync.call(ALI_NAME)

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
    ALI_NAME_CACHE.showToast.call(ALI_NAME, opts)
  },

  hideToast (options) {
    if (options.success || options.fail || options.complete) {
      error(`${ALI_NAME_STRING}.hideToast 不支持 success/fail/complete 参数`)
    }
    ALI_NAME_CACHE.hideToast.call(ALI_NAME, options)
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

      ALI_NAME_CACHE.confirm.call(ALI_NAME, opts)
    } else {
      opts = changeOpts(options, {
        confirmText: 'buttonText'
      })

      ALI_NAME_CACHE.alert.call(ALI_NAME, opts)
    }
  },

  showLoading (options) {
    const opts = changeOpts(options, {
      title: 'content'
    })
    ALI_NAME_CACHE.showLoading.call(ALI_NAME, opts)
  },

  hideLoading (options) {
    if (options.success || options.fail || options.complete) {
      error(`${ALI_NAME_STRING}.hideLoading 不支持 success/fail/complete 参数`)
    }
    ALI_NAME_CACHE.hideLoading.call(ALI_NAME, options)
  },

  showActionSheet (options) {
    const opts = changeOpts(options, {
      itemList: 'items'
    })

    const cacheSuc = opts.success || noop
    const cacheFail = opts.fail || noop

    opts.success = res => {
      let sucRes = changeOpts(res, {
        index: 'tapIndex'
      })
      if (sucRes.tapIndex === -1) {
        cacheFail.call(this, {
          errMsg: 'showActionSheet:fail cancel'
        })
      } else {
        cacheSuc.call(this, sucRes)
      }
    }

    ALI_NAME_CACHE.showActionSheet.call(ALI_NAME, opts)
  },

  showNavigationBarLoading (options) {
    if (options.success || options.fail || options.complete) {
      error(`${ALI_NAME_STRING}.showNavigationBarLoading 不支持 success/fail/complete 参数`)
    }
    ALI_NAME_CACHE.showNavigationBarLoading.call(ALI_NAME, options)
  },

  hideNavigationBarLoading (options) {
    if (options.success || options.fail || options.complete) {
      error(`${ALI_NAME_STRING}.hideNavigationBarLoading 不支持 success/fail/complete 参数`)
    }
    ALI_NAME_CACHE.hideNavigationBarLoading.call(ALI_NAME, options)
  },

  setNavigationBarTitle (options) {
    ALI_NAME_CACHE.setNavigationBar.call(ALI_NAME, options)
  },

  setNavigationBarColor (options) {
    ALI_NAME_CACHE.setNavigationBar.call(ALI_NAME, options)
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

    // request 在 1.11.0 以上版本才支持
    // httpRequest 即将被废弃，钉钉端仍需要使用
    if (ALI_NAME_CACHE.canIUse.call(ALI_NAME, 'request')) {
      return ALI_NAME_CACHE.request.call(ALI_NAME, opts)
    } else {
      return ALI_NAME_CACHE.httpRequest.call(ALI_NAME, opts)
    }
  },

  downloadFile (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePath: 'tempFilePath' })
    })

    return ALI_NAME_CACHE.downloadFile.call(ALI_NAME, opts)
  },

  uploadFile (options) {
    const opts = changeOpts(options, { name: 'fileName' })

    return ALI_NAME_CACHE.uploadFile.call(ALI_NAME, opts)
  },

  setStorageSync (key, data) {
    ALI_NAME_CACHE.setStorageSync.call(ALI_NAME, {
      key,
      data
    })
  },

  removeStorageSync (key) {
    ALI_NAME_CACHE.removeStorageSync.call(ALI_NAME, {
      key
    })
  },

  getStorageSync (key) {
    return ALI_NAME_CACHE.getStorageSync.call(ALI_NAME, {
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

    ALI_NAME_CACHE.previewImage.call(ALI_NAME, opts)
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

    ALI_NAME_CACHE.compressImage.call(ALI_NAME, opts)
  },

  chooseImage (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePaths: 'tempFilePaths' })
    })

    ALI_NAME_CACHE.chooseImage.call(ALI_NAME, opts)
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

    ALI_NAME_CACHE.getLocation.call(ALI_NAME, opts)
  },

  saveFile (options) {
    const opts = changeOpts(options, {
      tempFilePath: 'apFilePath'
    })

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePath: 'savedFilePath' })
    })

    ALI_NAME_CACHE.saveFile.call(ALI_NAME, opts)
  },

  removeSavedFile (options) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePath: 'savedFilePath' })
    })

    ALI_NAME_CACHE.removeSavedFile.call(ALI_NAME, opts)
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

    ALI_NAME_CACHE.getSavedFileList.call(ALI_NAME, opts)
  },

  getSavedFileInfo (options) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    ALI_NAME_CACHE.getSavedFileInfo.call(ALI_NAME, opts)
  },

  getFileInfo (options) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    ALI_NAME_CACHE.getFileInfo.call(ALI_NAME, opts)
  },

  addPhoneContact (options) {
    const opts = changeOpts(options, {
      weChatNumber: 'alipayAccount'
    })

    ALI_NAME_CACHE.addPhoneContact.call(ALI_NAME, opts)
  },

  setClipboardData (options) {
    const opts = changeOpts(options, {
      data: 'text'
    })

    ALI_NAME_CACHE.setClipboard.call(ALI_NAME, opts)
  },

  getClipboardData (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { text: 'data' })
    })

    ALI_NAME_CACHE.getClipboard.call(ALI_NAME, opts)
  },

  setScreenBrightness (options) {
    const opts = changeOpts(options, {
      value: 'brightness'
    })

    ALI_NAME_CACHE.setScreenBrightness.call(ALI_NAME, opts)
  },

  getScreenBrightness (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { brightness: 'value' })
    })

    ALI_NAME_CACHE.getScreenBrightness.call(ALI_NAME, opts)
  },

  makePhoneCall (options) {
    const opts = changeOpts(options, {
      phoneNumber: 'number'
    })

    ALI_NAME_CACHE.makePhoneCall.call(ALI_NAME, opts)
  },

  stopAccelerometer (options) {
    ALI_NAME_CACHE.offAccelerometerChange.call(ALI_NAME, options)
  },

  startAccelerometer () {
    info(`支付宝加速计不需要使用 ${ALI_NAME_STRING}.startAccelerometer 开始，可以直接在 ${ALI_NAME_STRING}.onAccelerometerChange 中监听`)
  },

  stopCompass (options) {
    ALI_NAME_CACHE.offCompassChange.call(ALI_NAME, options)
  },

  startCompass () {
    info(`支付宝罗盘不需要使用 ${ALI_NAME_STRING}.startCompass 开始，可以直接在 ${ALI_NAME_STRING}.onCompassChange 中监听`)
  },

  stopGyroscope (options) {
    ALI_NAME_CACHE.offGyroscopeChange.call(ALI_NAME, options)
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

    ALI_NAME_CACHE.scan.call(ALI_NAME, opts)
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

    ALI_NAME_CACHE.getAuthCode.call(ALI_NAME, opts)
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

    ALI_NAME_CACHE.getAuthUserInfo.call(ALI_NAME, opts)
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
        cacheSuc.call(this, res)
      } else {
        cacheFail.call(this, res)
      }
    }

    ALI_NAME_CACHE.tradePay.call(ALI_NAME, opts)
  },

  createCanvasContext (canvasId) {
    let ctx = ALI_NAME_CACHE.createCanvasContext.call(ALI_NAME, canvasId)

    CANVAS_MAP[canvasId] = ctx

    return ctx
  },

  canvasToTempFilePath (options) {
    if (!CANVAS_MAP[options.canvasId]) {
      error('支付宝调用 toTempFilePath 方法之前需要先调用 createCanvasContext 创建 context')
      return
    }

    const opts = changeOpts(options, { canvasId: '' })
    const ctx = CANVAS_MAP[options.canvasId]

    handleSuccess(opts, res => {
      return changeOpts(
        res,
        { apFilePath: 'tempFilePath' },
        { errMsg: 'canvasToTempFilePath:ok' }
      )
    })

    ctx.toTempFilePath(opts)
  },

  canvasPutImageData (options) {
    if (!CANVAS_MAP[options.canvasId]) {
      error('支付宝调用 putImageData 方法之前需要先调用 createCanvasContext 创建 context')
      return
    }

    const opts = changeOpts(options, { canvasId: '' })
    const ctx = CANVAS_MAP[options.canvasId]

    // success 里面的 this 指向参数 options
    handleSuccess(opts, res => {
      return changeOpts(res, undefined, { errMsg: 'canvasPutImageData:ok' }
      )
    }, options)

    ctx.putImageData(opts)
  },

  canvasGetImageData (options) {
    if (!CANVAS_MAP[options.canvasId]) {
      error('支付宝调用 getImageData 方法之前需要先调用 createCanvasContext 创建 context')
      return
    }

    const opts = changeOpts(options, { canvasId: '' })
    const ctx = CANVAS_MAP[options.canvasId]

    // success 里面的 this 指向参数 options
    handleSuccess(opts, undefined, options)

    ctx.getImageData(opts)
  }
}

/**
 * @param {Object} target 要代理的对象
 */
const proxyWxToAliApi = () => {
  Object.keys(wxToAliApi).forEach(api => {
    ALI_NAME[api] = wxToAliApi[api]
  })
}

export {
  wxToAliApi,
  proxyWxToAliApi
}
