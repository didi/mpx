import loadScript from './loadscript'

const SDK_URL_MAP = {
  wx: 'https://res.wx.qq.com/open/js/jweixin-1.3.2.js',
  qq: 'https://qqq.gtimg.cn/miniprogram/webview_jssdk/qqjssdk-1.0.0.js',
  ali: 'https://appx/web-view.min.js',
  baidu: 'https://b.bdstatic.com/searchbox/icms/searchbox/js/swan-2.0.4.js',
  tt: 'https://s3.pstatp.com/toutiao/tmajssdk/jssdk.js'
}

const ENV_PATH_MAP = {
  wx: ['wx', 'miniProgram'],
  qq: ['qq', 'miniProgram'],
  ali: ['my'],
  baidu: ['swan', 'webView'],
  tt: ['tt', 'miniProgram']
}

let env = null
// 环境判断
let systemUA = navigator.userAgent
if (systemUA.indexOf('AlipayClient') > -1) {
  env = 'ali'
} else if (systemUA.indexOf('miniProgram') > -1 || systemUA.indexOf('miniprogram') > -1) {
  env = systemUA.indexOf('QQ') > -1 ? 'qq' : 'wx'
} else if (systemUA.indexOf('swan') > -1) {
  env = 'baidu'
} else if (systemUA.indexOf('toutiao') > -1) {
  env = 'tt'
}

const webviewApiList = {}

function getEnvWebviewVariable () {
  return ENV_PATH_MAP[env].reduce((acc, cur) => acc[cur], window)
}

function getEnvVariable () {
  return window[ENV_PATH_MAP[env][0]]
}

const initWebviewBridge = () => {
  if (env === null) {
    console.log('mpxjs/webview: 未识别的环境，当前仅支持 微信、支付宝、百度、头条 QQ 小程序')
    return
  }
  const sdkReady = !window[env] ? SDK_URL_MAP[env] ? loadScript(SDK_URL_MAP[env]) : Promise.reject(new Error('未找到对应的sdk')) : Promise.resolve()
  getWebviewApi(sdkReady)
}

const getWebviewApi = (sdkReady) => {
  const webviewApiNameList = {
    navigateTo: 'navigateTo',
    navigateBack: 'navigateBack',
    switchTab: 'switchTab',
    reLaunch: 'reLaunch',
    redirectTo: 'redirectTo',
    getEnv: 'getEnv',
    postMessage: 'postMessage',
    getLoadError: 'getLoadError',
    onMessage: {
      ali: true
    }
  }

  for (let item in webviewApiNameList) {
    const apiName = typeof webviewApiNameList[item] === 'string' ? webviewApiNameList[item] : !webviewApiNameList[item][env] ? false : typeof webviewApiNameList[item][env] === 'string' ? webviewApiNameList[item][env] : item
    
    webviewApiList[item] = (...args) => {
      if (!apiName) {
        console.log(`${env}小程序不支持 ${item} 方法`)
      } else {
        return sdkReady.then(() => {
          if (apiName === 'getLoadError') {
            return Promise.resolve('js加载完成')
          }
          getEnvWebviewVariable()[apiName](...args)
        })
      }
    }
  }
}

const getAdvancedApi = (config, mpx) => {
  // 微信的非小程序相关api需要config配置
  if (!mpx) {
    console.log('需要提供挂载方法的mpx对象')
    return
  }
  if (window.wx) {
    if (config) {
      console.log('微信环境下需要配置wx.config才能挂载方法')
      return
    }
    window.wx.config(config)
  }

  // key为导出的标准名，对应平台不支持的话为undefined
  const ApiList = {
    'checkJSApi': {
      wx: 'checkJSApi'
    },
    'chooseImage': {
      wx: 'chooseImage',
      baidu: 'chooseImage',
      ali: 'chooseImage'
    },
    'previewImage': {
      wx: 'previewImage',
      baidu: 'previewImage',
      ali: 'previewImage'
    },
    'uploadImage': {
      wx: 'uploadImage'
    },
    'downloadImage': {
      wx: 'downloadImage'
    },
    'getLocalImgData': {
      wx: 'getLocalImgData'
    },
    'startRecord': {
      wx: 'startRecord'
    },
    'stopRecord': {
      wx: 'stopRecord'
    },
    'onVoiceRecordEnd': {
      wx: 'onVoiceRecordEnd'
    },
    'playVoice': {
      wx: 'playVoice'
    },
    'pauseVoice': {
      wx: 'pauseVoice'
    },
    'stopVoice': {
      wx: 'stopVoice'
    },
    'onVoicePlayEnd': {
      wx: 'onVoicePlayEnd'
    },
    'uploadVoice': {
      wx: 'uploadVoice'
    },
    'downloadVoice': {
      wx: 'downloadVoice'
    },
    'translateVoice': {
      wx: 'translateVoice'
    },
    'getNetworkType': {
      wx: 'getNetworkType',
      baidu: 'getNetworkType',
      ali: 'getNetworkType'
    },
    'openLocation': {
      wx: 'openLocation',
      baidu: 'openLocation',
      ali: 'openLocation'
    },
    'getLocation': {
      wx: 'getLocation',
      baidu: 'getLocation',
      ali: 'getLocation'
    },
    'startSearchBeacons': {
      wx: 'startSearchBeacons'
    },
    'stopSearchBeacons': {
      wx: 'stopSearchBeacons'
    },
    'onSearchBeacons': {
      wx: 'onSearchBeacons'
    },
    'scanQRCode': {
      wx: 'scanQRCode'
    },
    'chooseCard': {
      wx: 'chooseCard'
    },
    'addCard': {
      wx: 'addCard'
    },
    'openCard': {
      wx: 'openCard'
    },
    'alert': {
      ali: 'alert'
    },
    'showLoading': {
      ali: 'showLoading'
    },
    'hideLoading': {
      ali: 'hideLoading'
    },
    'setStorage': {
      ali: 'setStorage'
    },
    'getStorage': {
      ali: 'getStorage'
    },
    'removeStorage': {
      ali: 'removeStorage'
    },
    'clearStorage': {
      ali: 'clearStorage'
    },
    'getStorageInfo': {
      ali: 'getStorageInfo'
    },
    'startShare': {
      ali: 'startShare'
    },
    'tradePay': {
      ali: 'tradePay'
    },
    'onMessage': {
      ali: 'onMessage'
    }
  }

  for (let item in ApiList) {
    mpx[item] = (...args) => {
      if (!ApiList[item][env]) {
        console.error(`此环境不支持${item}方法`)
      } else {
        console.log(ApiList[item][env], 'ApiList[item][env]')
        getEnvVariable()[ApiList[item][env]](...args)
      }
    }
  }
}

initWebviewBridge()

const bridgeFunction = {
  ...webviewApiList,
  getAdvancedApi,
  mpxEnv: env
}

export {
  webviewApiList,
  getAdvancedApi,
  bridgeFunction
}
