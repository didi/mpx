/**
 * mpxjs webview bridge v2.0.11
 * (c) 2019 @mpxjs team
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

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    keys.push.apply(keys, Object.getOwnPropertySymbols(object));
  }

  if (enumerableOnly) keys = keys.filter(function (sym) {
    return Object.getOwnPropertyDescriptor(object, sym).enumerable;
  });
  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(source, true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(source).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
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
var env = null; // 环境判断

var systemUA = navigator.userAgent;

if (systemUA.indexOf('AlipayClient') > -1) {
  env = 'ali';
} else if (systemUA.indexOf('miniProgram') > -1 || systemUA.indexOf('miniprogram') > -1) {
  env = systemUA.indexOf('QQ') > -1 ? 'qq' : 'wx';
} else if (systemUA.indexOf('swan') > -1) {
  env = 'baidu';
} else if (systemUA.indexOf('toutiao') > -1) {
  env = 'tt';
}

if (env === null) {
  console.log('mpxjs/webview: 未识别的环境，当前仅支持 微信、支付宝、百度、头条 QQ 小程序');
}

var sdkReady = !window[env] ? SDK_URL_MAP[env] ? loadScript(SDK_URL_MAP[env]) : Promise.reject(new Error('未找到对应的sdk')) : Promise.resolve();
var wxConfig = null; // 微信的非小程序相关api需要config配置

var sdkConfigReady = function sdkConfigReady() {
  return env !== 'wx' ? sdkReady : new Promise(function (resolve, reject) {
    sdkReady.then(function () {
      if (!window.wx) {
        reject(new Error('sdk未就绪'));
      }

      if (wxConfig === null) {
        reject(new Error('wxSDK 未配置'));
      }

      window.wx.config(wxConfig);
      window.wx.ready(function () {
        resolve();
      });
      window.wx.error(function (res) {
        reject(res);
      });
    });
  });
};

var wxsdkConfig = function wxsdkConfig(config) {
  wxConfig = config;
};

function getEnvWebviewVariable() {
  return ENV_PATH_MAP[env].reduce(function (acc, cur) {
    return acc[cur];
  }, window);
}

function getEnvVariable() {
  return window[ENV_PATH_MAP[env][0]];
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
var exportApiList = {};

var _loop = function _loop(item) {
  exportApiList[item] = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (!ApiList[item][env]) {
      console.error("\u6B64\u73AF\u5883\u4E0D\u652F\u6301".concat(item, "\u65B9\u6CD5"));
    } else {
      sdkConfigReady().then(function () {
        var _getEnvVariable;

        (_getEnvVariable = getEnvVariable())[ApiList[item][env]].apply(_getEnvVariable, args);
      }, function (res) {
        console.error(res);
      })["catch"](function (e) {
        return console.error(e);
      });
    }
  };
};

for (var item in ApiList) {
  _loop(item);
}

var webviewApiNameList = {
  navigateTo: 'navigateTo',
  navigateBack: 'navigateBack',
  switchTab: 'switchTab',
  reLaunch: 'reLaunch',
  redirectTo: 'redirectTo',
  getEnv: 'getEnv',
  postMessage: 'postMessage',
  onMessage: {
    ali: true
  }
};
var webviewApiList = {};

var _loop2 = function _loop2(item) {
  var apiName = typeof webviewApiNameList[item] === 'string' ? webviewApiNameList[item] : !webviewApiNameList[item][env] ? false : typeof webviewApiNameList[item][env] === 'string' ? webviewApiNameList[item][env] : item;

  webviewApiList[item] = function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    if (!apiName) {
      console.log("".concat(env, "\u5C0F\u7A0B\u5E8F\u4E0D\u652F\u6301 ").concat(item, " \u65B9\u6CD5"));
    } else {
      sdkReady.then(function () {
        var _getEnvWebviewVariabl;

        (_getEnvWebviewVariabl = getEnvWebviewVariable())[apiName].apply(_getEnvWebviewVariabl, args);
      }, function (res) {
        console.log(res);
      })["catch"](function (e) {
        return console.log(e);
      });
    }
  };
};

for (var item in webviewApiNameList) {
  _loop2(item);
}

var bridgeFunction = _objectSpread2({}, webviewApiList, {}, exportApiList, {
  wxsdkConfig: wxsdkConfig
});

var navigateTo = webviewApiList.navigateTo,
    navigateBack = webviewApiList.navigateBack,
    switchTab = webviewApiList.switchTab,
    reLaunch = webviewApiList.reLaunch,
    redirectTo = webviewApiList.redirectTo,
    getEnv = webviewApiList.getEnv,
    postMessage = webviewApiList.postMessage;
var getLocation = exportApiList.getLocation,
    chooseImage = exportApiList.chooseImage,
    openLocation = exportApiList.openLocation,
    getNetworkType = exportApiList.getNetworkType,
    previewImage = exportApiList.previewImage;
var wxsdkConfig$1 = bridgeFunction.wxsdkConfig; // 此处导出的对象包含所有的api

export default bridgeFunction;
export { chooseImage, getEnv, getLocation, getNetworkType, navigateBack, navigateTo, openLocation, postMessage, previewImage, reLaunch, redirectTo, switchTab, wxsdkConfig$1 as wxsdkConfig };
