/*
*** 生成manifest文件features部分，https://doc.quickapp.cn/framework/manifest.html
 */
const util = require('./util')

module.exports = function registerFeatures (wxPay, packageName, shareObj, qqObj, wxObj, weiboObj) {
  let features = `[
        {"name": "system.resident"},
        {"name": "system.share"},
        {"name": "system.prompt"},
        {"name": "system.webview"},
        {"name": "system.notification"},
        {"name": "system.request"},
        {"name": "system.fetch"},
        {"name": "system.websocketfactory"},
        {"name": "system.storage"},
        {"name": "system.file"},
        {"name": "service.exchange"},
        {"name": "system.vibrator"},
        {"name": "system.barcode"},
        {"name": "system.sensor"},
        {"name": "system.clipboard"},
        {"name": "system.geolocation"},
        {"name": "system.shortcut"},
        {"name": "system.calendar"},
        {"name": "system.network"},
        {"name": "system.device"},
        {"name": "system.telecom"},
        {"name": "system.brightness"},
        {"name": "system.volume"},
        {"name": "system.battery"},
        {"name": "system.package"},
        {"name": "system.record"},
        {"name": "system.contact"},
        {"name": "system.sms"},
        {"name": "system.wifi"},
        {"name": "system.bluetooth"},
        {"name": "system.alarm"},
        {"name": "system.zip"},
        {"name": "system.cipher"},
        {"name": "system.media"},
        {"name": "system.image"},
        {"name": "hap.io.Video"},
        {"name": "system.audio"},
        {"name": "service.texttoaudio"},
        {"name": "service.push"},
        {"name": "service.pay"},
        {"name": "service.stats"},
        {"name": "service.account"},
        {"name": "service.health"},
        {"name":"service.ad"},
        {"name": "service.alipay"}
      ]`
  if (wxPay && wxPay.sign) {
    features += ',\n'
    features += `
      {\n
        "name": "service.wxpay",\n
        "params": {\n
          "package": "${packageName}",\n
          "sign": "${wxPay.sign}",\n
          "url": "${wxPay.url || ''}"\n
        }\n
      }
    `
  }
  if (shareObj && shareObj.appSign) {
    features += ',\n'
    features += `{\n
      "name": "service.share",\n
      "params": {\n
        "appSign": "${shareObj.appSign}",\n
        "qqKey": "${shareObj.qqKey || ''}"\n
        "wxKey": "${shareObj.wxKey || ''}",\n
        "sinaKey": "${shareObj.sinaKey || ''}"\n
      }\n
    }`
  }
  if (qqObj && qqObj.appId) {
    features += ',\n'
    features += `{\n
    "name": "service.qqaccount",\n
    "params": {\n
      "appId": "${qqObj.appId}",\n
      "clientId": "${qqObj && qqObj.clientId || ''}"\n
    },\n
  }`
  }
  if (wxObj && wxObj.appId) {
    features += ',\n'
    features += `{\n
      "name": "service.wxaccount",\n
      "params": {\n
        "appId": "${wxObj.appId}"\n
      }\n
    }`
  }
  if (weiboObj && weiboObj.appKey) {
    features += ',\n'
    features += `{\n
      "name": "service.wbaccount",\n
      "params": {\n
        "appKey": "${weiboObj.appKey}"\n
      }\n
    }\n`
  }
  return features
}
