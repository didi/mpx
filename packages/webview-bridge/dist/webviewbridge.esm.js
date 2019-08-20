/**
 * mpxjs webview bridge v2.1.12
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

var webviewApiList = {};

var wxsdkConfig = function wxsdkConfig(config) {
};

function getEnvWebviewVariable() {
  return ENV_PATH_MAP[env].reduce(function (acc, cur) {
    return acc[cur];
  }, window);
}

var initWebviewBridge = function initWebviewBridge() {
  if (env === null) {
    console.log('mpxjs/webview: 未识别的环境，当前仅支持 微信、支付宝、百度、头条 QQ 小程序');
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
    _loop(item);
  }
};

initWebviewBridge();

var bridgeFunction = _objectSpread({}, webviewApiList, {
  // ...exportApiList,
  wxsdkConfig: wxsdkConfig,
  mpxEnv: env
});

var navigateTo = webviewApiList.navigateTo,
    navigateBack = webviewApiList.navigateBack,
    switchTab = webviewApiList.switchTab,
    reLaunch = webviewApiList.reLaunch,
    redirectTo = webviewApiList.redirectTo,
    getEnv = webviewApiList.getEnv,
    postMessage = webviewApiList.postMessage; // const { getLocation, chooseImage, openLocation, getNetworkType, previewImage } = exportApiList

var wxsdkConfig$1 = bridgeFunction.wxsdkConfig; // 此处导出的对象包含所有的api

export default bridgeFunction;
export { getEnv, navigateBack, navigateTo, postMessage, reLaunch, redirectTo, switchTab, wxsdkConfig$1 as wxsdkConfig };
