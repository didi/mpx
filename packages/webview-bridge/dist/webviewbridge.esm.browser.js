/**
 * mpxjs webview bridge v2.1.12
 * (c) 2019 @mpxjs team
 * @license Apache
 */
function loadScript (url, { time = 5000, crossOrigin = false } = {}) {
  function request () {
    return new Promise((resolve, reject) => {
      let sc = document.createElement('script');
      sc.type = 'text/javascript';
      sc.async = 'async';

      // 可选地增加 crossOrigin 特性
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
        reject(new Error(`load ${url} error`));
        sc.onerror = null;
      };

      sc.src = url;
      document.getElementsByTagName('head')[0].appendChild(sc);
    })
  }

  function timeout () {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`load ${url} timeout`));
      }, time);
    })
  }

  return Promise.race([request(), timeout()])
}

const SDK_URL_MAP = {
  wx: 'https://res.wx.qq.com/open/js/jweixin-1.3.2.js',
  qq: 'https://qqq.gtimg.cn/miniprogram/webview_jssdk/qqjssdk-1.0.0.js',
  ali: 'https://appx/web-view.min.js',
  baidu: 'https://b.bdstatic.com/searchbox/icms/searchbox/js/swan-2.0.4.js',
  tt: 'https://s3.pstatp.com/toutiao/tmajssdk/jssdk.js'
};

const ENV_PATH_MAP = {
  wx: ['wx', 'miniProgram'],
  qq: ['qq', 'miniProgram'],
  ali: ['my'],
  baidu: ['swan', 'webView'],
  tt: ['tt', 'miniProgram']
};

let env = null;
// 环境判断
let systemUA = navigator.userAgent;
if (systemUA.indexOf('AlipayClient') > -1) {
  env = 'ali';
} else if (systemUA.indexOf('miniProgram') > -1 || systemUA.indexOf('miniprogram') > -1) {
  env = systemUA.indexOf('QQ') > -1 ? 'qq' : 'wx';
} else if (systemUA.indexOf('swan') > -1) {
  env = 'baidu';
} else if (systemUA.indexOf('toutiao') > -1) {
  env = 'tt';
}

const webviewApiList = {};
const wxsdkConfig = (config) => {
};

function getEnvWebviewVariable () {
  return ENV_PATH_MAP[env].reduce((acc, cur) => acc[cur], window)
}

const initWebviewBridge = () => {
  if (env === null) {
    console.log('mpxjs/webview: 未识别的环境，当前仅支持 微信、支付宝、百度、头条 QQ 小程序');
    return
  }
  const sdkReady = !window[env] ? SDK_URL_MAP[env] ? loadScript(SDK_URL_MAP[env]) : Promise.reject(new Error('未找到对应的sdk')) : Promise.resolve();
  getWebviewApi(sdkReady);
};

const getWebviewApi = (sdkReady) => {
  const webviewApiNameList = {
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

  for (let item in webviewApiNameList) {
    const apiName = typeof webviewApiNameList[item] === 'string' ? webviewApiNameList[item] : !webviewApiNameList[item][env] ? false : typeof webviewApiNameList[item][env] === 'string' ? webviewApiNameList[item][env] : item;

    webviewApiList[item] = (...args) => {
      if (!apiName) {
        console.log(`${env}小程序不支持 ${item} 方法`);
      } else {
        sdkReady.then(() => {
          getEnvWebviewVariable()[apiName](...args);
        }, (res) => {
          console.log(res);
        }).catch(e => console.log(e));
      }
    };
  }
};

initWebviewBridge();

const bridgeFunction = {
  ...webviewApiList,
  // ...exportApiList,
  wxsdkConfig,
  mpxEnv: env
};

const { navigateTo, navigateBack, switchTab, reLaunch, redirectTo, getEnv, postMessage } = webviewApiList;
// const { getLocation, chooseImage, openLocation, getNetworkType, previewImage } = exportApiList
const { wxsdkConfig: wxsdkConfig$1 } = bridgeFunction;

export default bridgeFunction;
export { getEnv, navigateBack, navigateTo, postMessage, reLaunch, redirectTo, switchTab, wxsdkConfig$1 as wxsdkConfig };
