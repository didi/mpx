import { changeOpts, handleSuccess, warn, info, noop } from '../utils'

const ALI_NAME = my
const ALI_NAME_STRING = 'my'

const wxToMyApis = {
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

    ALI_NAME.getSystemInfo.call(ALI_NAME, opts)
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
    ALI_NAME.showToast.call(ALI_NAME, opts)
  },

  hideToast (options) {
    if (options.success || options.fail || options.complete) {
      warn(`${ALI_NAME_STRING}.hideToast 不支持 success/fail/complete 参数`)
    }
    ALI_NAME.hideToast.call(ALI_NAME, options)
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

      ALI_NAME.confirm.call(ALI_NAME, opts)
    } else {
      opts = changeOpts(options, {
        confirmText: 'buttonText'
      })

      ALI_NAME.alert.call(ALI_NAME, opts)
    }
  },

  showLoading (options) {
    const opts = changeOpts(options, {
      title: 'content'
    })
    ALI_NAME.showLoading.call(ALI_NAME, opts)
  },

  hideLoading (options) {
    if (options.success || options.fail || options.complete) {
      warn(`${ALI_NAME_STRING}.hideLoading 不支持 success/fail/complete 参数`)
    }
    ALI_NAME.hideLoading.call(ALI_NAME, options)
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

    ALI_NAME.showActionSheet.call(ALI_NAME, opts)
  },

  showNavigationBarLoading (options) {
    if (options.success || options.fail || options.complete) {
      warn(`${ALI_NAME_STRING}.showNavigationBarLoading 不支持 success/fail/complete 参数`)
    }
    ALI_NAME.showNavigationBarLoading.call(ALI_NAME, options)
  },

  hideNavigationBarLoading (options) {
    if (options.success || options.fail || options.complete) {
      warn(`${ALI_NAME_STRING}.hideNavigationBarLoading 不支持 success/fail/complete 参数`)
    }
    ALI_NAME.hideNavigationBarLoading.call(ALI_NAME, options)
  },

  setNavigationBarTitle (options) {
    ALI_NAME.setNavigationBar.call(ALI_NAME, options)
  },
  
  setNavigationBarColor (options) {
    ALI_NAME.setNavigationBar.call(ALI_NAME, options)
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
    ALI_NAME.request.call(ALI_NAME, opts)
  },

  setStorageSync (key, data) {
    ALI_NAME.setStorageSync.call(ALI_NAME, {
      key,
      data
    })
  },

  removeStorageSync (key) {
    ALI_NAME.removeStorageSync.call(ALI_NAME, {
      key
    })
  },

  getStorageSync (key) {
    return ALI_NAME.getStorageSync.call(ALI_NAME, {
      key
    }).data
  },

  previewImage (options) {
    const opts = changeOpts(options)
    
    if (opts.current) {
      let idx = options.urls.indexOf(opts.current)
      opts.current = idx !== -1 ? idx : 0
    }

    ALI_NAME.previewImage.call(ALI_NAME, opts)
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

    ALI_NAME.compressImage.call(ALI_NAME, opts)
  },

  chooseImage (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePaths: 'tempFilePaths' })
    })

    ALI_NAME.chooseImage.call(ALI_NAME, opts)
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

    ALI_NAME.getLocation.call(ALI_NAME, opts)
  },

  saveFile (options) {
    const opts = changeOpts(options, {
      tempFilePath: 'apFilePath'
    })
    
    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePath: 'savedFilePath' })
    })

    ALI_NAME.saveFile.call(ALI_NAME, opts)
  },

  removeSavedFile (options) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })
    
    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePath: 'savedFilePath' })
    })

    ALI_NAME.removeSavedFile.call(ALI_NAME, opts)
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

    ALI_NAME.getSavedFileList.call(ALI_NAME, opts)
  },

  getSavedFileInfo (options) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    ALI_NAME.getSavedFileInfo.call(ALI_NAME, opts)
  },

  getFileInfo (options) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    ALI_NAME.getFileInfo.call(ALI_NAME, opts)
  },

  addPhoneContact (options) {
    const opts = changeOpts(options, {
      weChatNumber: 'alipayAccount'
    })

    ALI_NAME.addPhoneContact.call(ALI_NAME, opts)
  },

  setClipboardData (options) {
    const opts = changeOpts(options, {
      data: 'text'
    })

    ALI_NAME.setClipboard.call(ALI_NAME, opts)
  },

  getClipboardData (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { text: 'data' })
    })

    ALI_NAME.getClipboard.call(ALI_NAME, opts)
  },

  setScreenBrightness (options) {
    const opts = changeOpts(options, {
      value: 'brightness'
    })

    ALI_NAME.setScreenBrightness.call(ALI_NAME, opts)
  },

  getScreenBrightness (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { brightness: 'value' })
    })

    ALI_NAME.getScreenBrightness.call(ALI_NAME, opts)
  },

  makePhoneCall (options) {
    const opts = changeOpts(options, {
      phoneNumber: 'number'
    })

    ALI_NAME.makePhoneCall.call(ALI_NAME, opts)
  },

  stopAccelerometer (options) {
    ALI_NAME.offAccelerometerChange.call(ALI_NAME, options)
  },

  startAccelerometer () {
    info(`支付宝加速计不需要使用 ${ALI_NAME_STRING}.startAccelerometer 开始，可以直接在 ${ALI_NAME_STRING}.onAccelerometerChange 中监听`)
  },

  stopCompass (options) {
    ALI_NAME.offCompassChange.call(ALI_NAME, options)
  },

  startCompass () {
    info(`支付宝罗盘不需要使用 ${ALI_NAME_STRING}.startCompass 开始，可以直接在 ${ALI_NAME_STRING}.onCompassChange 中监听`)
  },

  stopGyroscope (options) {
    ALI_NAME.offGyroscopeChange.call(ALI_NAME, options)
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

    ALI_NAME.scan.call(ALI_NAME, opts)
  },

  login (options) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { authCode: 'code' })
    })

    ALI_NAME.getAuthCode.call(ALI_NAME, opts)
  },

  checkSession () {
    warn(`支付宝不支持检查登录过期函数 checkSession`)
  }
}

/**
 * @param {Object} target 要代理的对象
 */
const proxyMyApi = target => {
  Object.keys(wxToMyApis).forEach(api => {
    target[api] = wxToMyApis[api]
  })
}

export {
  wxToMyApis,
  proxyMyApi
}
