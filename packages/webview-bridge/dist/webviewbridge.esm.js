/**
 * mpxjs webview bridge v2.6.61
 * (c) 2021 @mpxjs team
 * @license Apache
 */
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

function loadScript(url) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$time = _ref.time,
      time = _ref$time === void 0 ? 5000 : _ref$time,
      _ref$crossOrigin = _ref.crossOrigin,
      crossOrigin = _ref$crossOrigin === void 0 ? false : _ref$crossOrigin;

  function request() {
    return new Promise(function (resolve, reject) {
      var sc = document.createElement('script');
      sc.type = 'text/javascript';
      sc.async = 'async'; // 可选地增加 crossOrigin 特性

      if (crossOrigin) {
        sc.crossOrigin = 'anonymous';
      }

      sc.onload = sc.onreadystatechange = function () {
        if (!this.readyState || /^(loaded|complete)$/.test(this.readyState)) {
          resolve();
          sc.onload = sc.onreadystatechange = null;
        }
      };

      sc.onerror = function () {
        reject(new Error("load ".concat(url, " error")));
        sc.onerror = null;
      };

      sc.src = url;
      document.getElementsByTagName('head')[0].appendChild(sc);
    });
  }

  function timeout() {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        reject(new Error("load ".concat(url, " timeout")));
      }, time);
    });
  }

  return Promise.race([request(), timeout()]);
}

var SDK_URL_MAP = {
  wx: 'https://res.wx.qq.com/open/js/jweixin-1.3.2.js',
  qq: 'https://qqq.gtimg.cn/miniprogram/webview_jssdk/qqjssdk-1.0.0.js',
  ali: 'https://appx/web-view.min.js',
  baidu: 'https://b.bdstatic.com/searchbox/icms/searchbox/js/swan-2.0.4.js',
  tt: 'https://s3.pstatp.com/toutiao/tmajssdk/jssdk.js'
};
var ENV_PATH_MAP = {
  wx: ['wx', 'miniProgram'],
  qq: ['qq', 'miniProgram'],
  ali: ['my'],
  baidu: ['swan', 'webView'],
  tt: ['tt', 'miniProgram']
};
var env = null;
var isOrigin;
window.addEventListener('message', function (event) {
  isOrigin = event.data === event.origin;

  if (isOrigin) {
    env = 'web';
    window.parent.postMessage({
      type: 'load',
      detail: {
        load: true
      }
    }, '*');
  }
}, false); // 环境判断

var systemUA = navigator.userAgent;

if (systemUA.indexOf('AlipayClient') > -1) {
  env = 'ali';
} else if (systemUA.toLowerCase().indexOf('miniprogram') > -1) {
  env = systemUA.indexOf('QQ') > -1 ? 'qq' : 'wx';
} else if (systemUA.indexOf('swan') > -1) {
  env = 'baidu';
} else if (systemUA.indexOf('toutiao') > -1) {
  env = 'tt';
} else {
  window.parent.postMessage({
    type: 'load',
    detail: {
      load: true
    }
  }, '*');
}

function postMessage(type, data) {
  var eventType;

  switch (type) {
    case 'postMessage':
      eventType = 'message';
      break;

    case 'navigateBack':
      eventType = 'navigateBack';
      break;

    case 'navigateTo':
      eventType = 'navigateTo';
      break;

    case 'redirectTo':
      eventType = 'redirectTo';
      break;

    case 'switchTab':
      eventType = 'switchTab';
      break;

    case 'reLaunch':
      eventType = 'reLaunch';
      break;

    case 'getEnv':
      eventType = 'getEnv';
      break;
  }

  if (type !== 'getEnv' && isOrigin) {
    window.parent.postMessage({
      type: eventType,
      detail: {
        data: data
      }
    }, '*');
  } else {
    data({
      miniprogram: false
    });
  }
}

var webviewApiList = {};

function getEnvWebviewVariable() {
  return ENV_PATH_MAP[env].reduce(function (acc, cur) {
    return acc[cur];
  }, window);
}

function getEnvVariable() {
  return window[ENV_PATH_MAP[env][0]];
}

var initWebviewBridge = function initWebviewBridge() {
  if (env === null) {
    console.log('mpxjs/webview: 未识别的环境，当前仅支持 微信、支付宝、百度、头条 QQ 小程序');
    getWebviewApi();
    return;
  }

  var sdkReady = !window[env] ? SDK_URL_MAP[env] ? loadScript(SDK_URL_MAP[env]) : Promise.reject(new Error('未找到对应的sdk')) : Promise.resolve();
  getWebviewApi(sdkReady);
};

var getWebviewApi = function getWebviewApi(sdkReady) {
  var webviewApiNameList = {
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
  };

  var _loop = function _loop(item) {
    var apiName = typeof webviewApiNameList[item] === 'string' ? webviewApiNameList[item] : !webviewApiNameList[item][env] ? false : typeof webviewApiNameList[item][env] === 'string' ? webviewApiNameList[item][env] : item;

    webviewApiList[item] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (env === 'web') {
        return postMessage.apply(void 0, [item].concat(args)); // console.log(`${env}小程序不支持 ${item} 方法`)
      } else {
        return sdkReady.then(function () {
          var _getEnvWebviewVariabl;

          if (apiName === 'getLoadError') {
            return Promise.resolve('js加载完成');
          }

          (_getEnvWebviewVariabl = getEnvWebviewVariable())[apiName].apply(_getEnvWebviewVariabl, args);
        });
      }
    };
  };

  for (var item in webviewApiNameList) {
    _loop(item);
  }
};

var getAdvancedApi = function getAdvancedApi(config, mpx) {
  // 微信的非小程序相关api需要config配置
  if (!mpx) {
    console.log('需要提供挂载方法的mpx对象');
    return;
  }

  if (window.wx) {
    if (config) {
      console.log('微信环境下需要配置wx.config才能挂载方法');
      return;
    }

    window.wx.config(config);
  } // key为导出的标准名，对应平台不支持的话为undefined


  var ApiList = {
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
  };

  var _loop2 = function _loop2(item) {
    mpx[item] = function () {
      if (!ApiList[item][env]) {
        console.error("\u6B64\u73AF\u5883\u4E0D\u652F\u6301".concat(item, "\u65B9\u6CD5"));
      } else {
        var _getEnvVariable;

        console.log(ApiList[item][env], 'ApiList[item][env]');

        (_getEnvVariable = getEnvVariable())[ApiList[item][env]].apply(_getEnvVariable, arguments);
      }
    };
  };

  for (var item in ApiList) {
    _loop2(item);
  }
};

initWebviewBridge();

var bridgeFunction = _objectSpread({}, webviewApiList, {
  getAdvancedApi: getAdvancedApi,
  mpxEnv: env
});

var navigateTo = webviewApiList.navigateTo,
    navigateBack = webviewApiList.navigateBack,
    switchTab = webviewApiList.switchTab,
    reLaunch = webviewApiList.reLaunch,
    redirectTo = webviewApiList.redirectTo,
    getEnv = webviewApiList.getEnv,
    postMessage$1 = webviewApiList.postMessage,
    getLoadError = webviewApiList.getLoadError;
var getAdvancedApi$1 = bridgeFunction.getAdvancedApi; // 此处导出的对象包含所有的api

export default bridgeFunction;
export { getAdvancedApi$1 as getAdvancedApi, getEnv, getLoadError, navigateBack, navigateTo, postMessage$1 as postMessage, reLaunch, redirectTo, switchTab };
