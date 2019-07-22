import { changeOpts, handleSuccess, getEnvObj, error, warn, noop } from '../utils'

const ALI_OBJ = getEnvObj()
const TIPS_NAME = '支付宝环境 mpx'

// canvas api 用
const CANVAS_MAP = {}

const wxToAliApi = {
  /**
   * 基础
   */

  getSystemInfo (options = {}) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      res.system = `${res.platform} ${res.system}`

      // 支付宝 windowHeight 可能为 0
      if (!res.windowHeight) {
        res.windowHeight = Math.floor(res.screenHeight * res.windowWidth / res.screenWidth) - 50
      }

      return res
    })

    ALI_OBJ.getSystemInfo(opts)
  },

  getSystemInfoSync () {
    let res = ALI_OBJ.getSystemInfoSync() || {}

    res.system = `${res.platform} ${res.system}`

    // 支付宝 windowHeight 可能为 0
    if (!res.windowHeight) {
      res.windowHeight = Math.floor(res.screenHeight * res.windowWidth / res.screenWidth) - 50
    }

    return res
  },

  /**
   * 界面
   */

  showToast (options = {}) {
    const opts = changeOpts(options, {
      title: 'content',
      icon: 'type'
    })
    ALI_OBJ.showToast(opts)
  },

  hideToast (options = {}) {
    if (options.success || options.fail || options.complete) {
      warn(`${TIPS_NAME}.hideToast 不支持 success/fail/complete 参数`)
    }
    ALI_OBJ.hideToast(options)
  },

  showModal (options = {}) {
    let opts

    if (options.showCancel === undefined || options.showCancel) {
      opts = changeOpts(options, {
        confirmText: 'confirmButtonText',
        cancelText: 'cancelButtonText'
      })

      handleSuccess(opts, res => {
        return changeOpts(res, undefined, { 'cancel': !res.confirm })
      })

      ALI_OBJ.confirm(opts)
    } else {
      opts = changeOpts(options, {
        confirmText: 'buttonText'
      })

      ALI_OBJ.alert(opts)
    }
  },

  showLoading (options = {}) {
    const opts = changeOpts(options, {
      title: 'content'
    })
    ALI_OBJ.showLoading(opts)
  },

  hideLoading (options = {}) {
    if (options.success || options.fail || options.complete) {
      warn(`${TIPS_NAME}.hideLoading 不支持 success/fail/complete 参数`)
    }
    ALI_OBJ.hideLoading(options)
  },

  showActionSheet (options = {}) {
    const opts = changeOpts(options, {
      itemList: 'items'
    })

    const cacheSuc = opts.success || noop
    const cacheFail = opts.fail || noop

    opts.success = function (res) {
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

    ALI_OBJ.showActionSheet(opts)
  },

  showNavigationBarLoading (options = {}) {
    if (options.success || options.fail || options.complete) {
      warn(`${TIPS_NAME}.showNavigationBarLoading 不支持 success/fail/complete 参数`)
    }
    ALI_OBJ.showNavigationBarLoading(options)
  },

  hideNavigationBarLoading (options = {}) {
    if (options.success || options.fail || options.complete) {
      warn(`${TIPS_NAME}.hideNavigationBarLoading 不支持 success/fail/complete 参数`)
    }
    ALI_OBJ.hideNavigationBarLoading(options)
  },

  setNavigationBarTitle (options = {}) {
    ALI_OBJ.setNavigationBar(options)
  },

  setNavigationBarColor (options = {}) {
    ALI_OBJ.setNavigationBar(options)
  },

  /**
   * 网络
   */

  request (options = {}) {
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
    if (ALI_OBJ.canIUse('request')) {
      return ALI_OBJ.request(opts)
    } else {
      return ALI_OBJ.httpRequest(opts)
    }
  },

  downloadFile (options = {}) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePath: 'tempFilePath' })
    })

    return ALI_OBJ.downloadFile(opts)
  },

  uploadFile (options = {}) {
    const opts = changeOpts(options, { name: 'fileName' })

    return ALI_OBJ.uploadFile(opts)
  },

  /**
   * 数据缓存
   */

  setStorageSync (key, data) {
    ALI_OBJ.setStorageSync({
      key,
      data
    })
  },

  removeStorageSync (key) {
    ALI_OBJ.removeStorageSync({
      key
    })
  },

  getStorageSync (key) {
    return ALI_OBJ.getStorageSync({
      key
    }).data
  },

  /**
   * 媒体
   */

  saveImageToPhotosAlbum (key) {
    warn(`如果想要保存在线图片链接，可以直接使用 ${TIPS_NAME}.saveImage`)
  },

  previewImage (options = {}) {
    const opts = changeOpts(options)

    if (opts.current) {
      let idx = options.urls.indexOf(opts.current)
      opts.current = idx !== -1 ? idx : 0
    }

    ALI_OBJ.previewImage(opts)
  },

  compressImage (options = {}) {
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

    ALI_OBJ.compressImage(opts)
  },

  chooseImage (options = {}) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePaths: 'tempFilePaths' })
    })

    ALI_OBJ.chooseImage(opts)
  },

  /**
   * 位置
   */

  getLocation (options = {}) {
    if (options.aliType === undefined && options.type) {
      warn(`如果要针对支付宝设置 ${TIPS_NAME}.getLocation 中的 type 参数，请使用 aliType, 取值为 0~3`)
      options.aliType = 0
    }
    if (options.altitude) {
      error(`支付宝 ${TIPS_NAME}.getLocation 不支持获取高度信息`)
    }

    const opts = changeOpts(options, {
      type: '',
      aliType: 'type'
    })

    ALI_OBJ.getLocation(opts)
  },

  /**
   * 文件
   */

  saveFile (options = {}) {
    const opts = changeOpts(options, {
      tempFilePath: 'apFilePath'
    })

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePath: 'savedFilePath' })
    })

    ALI_OBJ.saveFile(opts)
  },

  removeSavedFile (options = {}) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    handleSuccess(opts, res => {
      return changeOpts(res, { apFilePath: 'savedFilePath' })
    })

    ALI_OBJ.removeSavedFile(opts)
  },

  getSavedFileList (options = {}) {
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

    ALI_OBJ.getSavedFileList(opts)
  },

  getSavedFileInfo (options = {}) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    ALI_OBJ.getSavedFileInfo(opts)
  },

  getFileInfo (options = {}) {
    const opts = changeOpts(options, {
      filePath: 'apFilePath'
    })

    ALI_OBJ.getFileInfo(opts)
  },

  /**
   * 设备
   */

  addPhoneContact (options = {}) {
    const opts = changeOpts(options, {
      weChatNumber: 'alipayAccount'
    })

    ALI_OBJ.addPhoneContact(opts)
  },

  setClipboardData (options = {}) {
    const opts = changeOpts(options, {
      data: 'text'
    })

    ALI_OBJ.setClipboard(opts)
  },

  getClipboardData (options = {}) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { text: 'data' })
    })

    ALI_OBJ.getClipboard(opts)
  },

  setScreenBrightness (options = {}) {
    const opts = changeOpts(options, {
      value: 'brightness'
    })

    ALI_OBJ.setScreenBrightness(opts)
  },

  getScreenBrightness (options = {}) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { brightness: 'value' })
    })

    ALI_OBJ.getScreenBrightness(opts)
  },

  makePhoneCall (options = {}) {
    const opts = changeOpts(options, {
      phoneNumber: 'number'
    })

    ALI_OBJ.makePhoneCall(opts)
  },

  stopAccelerometer (options = {}) {
    ALI_OBJ.offAccelerometerChange(options)
  },

  startAccelerometer () {
    warn(`支付宝加速计不需要使用 ${TIPS_NAME}.startAccelerometer 开始，可以直接在 ${TIPS_NAME}.onAccelerometerChange 中监听`)
  },

  stopCompass (options = {}) {
    ALI_OBJ.offCompassChange(options)
  },

  startCompass () {
    warn(`支付宝罗盘不需要使用 ${TIPS_NAME}.startCompass 开始，可以直接在 ${TIPS_NAME}.onCompassChange 中监听`)
  },

  stopGyroscope (options = {}) {
    ALI_OBJ.offGyroscopeChange(options)
  },

  startGyroscope () {
    warn(`支付宝陀螺仪不需要使用 ${TIPS_NAME}.startGyroscope 开始，可以直接在 ${TIPS_NAME}.onGyroscopeChange 中监听`)
  },

  scanCode (options = {}) {
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
          error(`${TIPS_NAME}.scanCode 只支持扫描条形码和二维码，请将 type 设置为 barCode/qrCode`)
          opts.type = 'qr'
          break
      }
    }

    handleSuccess(opts, res => {
      return changeOpts(res, { code: 'result' })
    })

    ALI_OBJ.scan(opts)
  },

  /**
   * 开放接口
   */

  login (options = {}) {
    const opts = changeOpts(options)

    handleSuccess(opts, res => {
      return changeOpts(res, { authCode: 'code' })
    })

    ALI_OBJ.getAuthCode(opts)
  },

  checkSession () {
    warn(`支付宝不支持 ${TIPS_NAME}.checkSession 检查登录过期`)
  },

  getUserInfo (options = {}) {
    if (options.withCredentials === true) {
      warn(`支付宝不支持在 ${TIPS_NAME}.getUserInfo 使用 withCredentials 参数中获取等敏感信息`)
    }
    if (options.lang) {
      warn(`支付宝不支持在 ${TIPS_NAME}.getUserInfo 中使用 lang 参数`)
    }

    let opts = changeOpts(options)

    handleSuccess(opts, res => {
      let userInfo = changeOpts(res, { avatar: 'avatarUrl' }, { gender: 0 })
      const params = ['country', 'province', 'city', 'language']

      params.forEach(key => {
        Object.defineProperty(userInfo, key, {
          get () {
            warn(`支付宝 ${TIPS_NAME}.getUserInfo 不能获取 ${key}`)
            return ''
          }
        })
      })

      return {
        userInfo
      }
    })

    ALI_OBJ.getAuthUserInfo(opts)
  },

  requestPayment (options = {}) {
    if (!options.tradeNO) {
      error(`请在支付函数 ${TIPS_NAME}.requestPayment 中添加 tradeNO 参数用于支付宝支付`)
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

    // 抹平用微信的 complete
    if (typeof opts.complete === 'function') {
      const cacheComplete = opts.complete
      opts.complete = function (res) {
        if (+res.resultCode === 9000) {
          res.errMsg = 'requestPayment:ok'
          cacheComplete.call(this, res)
        }
      }
    }

    opts.success = function (res) {
      if (+res.resultCode === 9000) {
        cacheSuc.call(this, res)
      } else {
        cacheFail.call(this, res)
      }
    }

    ALI_OBJ.tradePay(opts)
  },

  /**
   * 画布
   */

  createCanvasContext (canvasId = {}) {
    let ctx = ALI_OBJ.createCanvasContext(canvasId)

    CANVAS_MAP[canvasId] = ctx

    return ctx
  },

  canvasToTempFilePath (options = {}) {
    if (!CANVAS_MAP[options.canvasId]) {
      error(`支付宝调用 ${TIPS_NAME}.toTempFilePath 方法之前需要先调用 ${TIPS_NAME}.createCanvasContext 创建 context`)
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

  canvasPutImageData (options = {}) {
    if (!CANVAS_MAP[options.canvasId]) {
      error(`支付宝调用 ${TIPS_NAME}.putImageData 方法之前需要先调用 ${TIPS_NAME}.createCanvasContext 创建 context`)
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

  canvasGetImageData (options = {}) {
    if (!CANVAS_MAP[options.canvasId]) {
      error(`支付宝调用 ${TIPS_NAME}.getImageData 方法之前需要先调用 ${TIPS_NAME}.createCanvasContext 创建 context`)
      return
    }

    const opts = changeOpts(options, { canvasId: '' })
    const ctx = CANVAS_MAP[options.canvasId]

    // success 里面的 this 指向参数 options
    handleSuccess(opts, undefined, options)

    ctx.getImageData(opts)
  },

  /**
   * WXML
   */

  createSelectorQuery (options = {}) {
    const selectorQuery = ALI_OBJ.createSelectorQuery(options)
    const proxyMethods = ['boundingClientRect', 'scrollOffset']
    const cbs = []
    proxyMethods.forEach((name) => {
      const originalMethod = selectorQuery[name]
      selectorQuery[name] = function (cb = noop) {
        cbs.push(cb)
        return originalMethod.call(this)
      }
    })

    const originalExec = selectorQuery.exec
    selectorQuery.exec = function (originalCb = noop) {
      const cb = function (results) {
        results.forEach((item, index) => {
          cbs[index](item)
        })
        originalCb(results)
      }
      return originalExec.call(this, cb)
    }

    selectorQuery.in = function () {
      return this
    }

    return selectorQuery
  }
}

export default wxToAliApi
