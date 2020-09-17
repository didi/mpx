/*
*** 生成manifest文件config部分，https://doc.quickapp.cn/framework/manifest.html
 */

const util = require('./util')

module.exports = function genConfig (configInfo, appJsonRules, isProd) {
  let config = `{`

  const logLevel = configInfo && configInfo.logLevel ? configInfo.logLevel : isProd ? 'off' : 'debug'
  config += `
        "logLevel": "${logLevel}"`

  if (configInfo && configInfo.designWidth) {
    config += `,
        "designWidth": ${configInfo.designWidth}`
  }

  let network
  if (appJsonRules && appJsonRules.networkTimeout && !util.isObjectEmpty(appJsonRules.networkTimeout)) {
    network = Object.assign({}, util.obj2Json(appJsonRules.networkTimeout))
  } else if (configInfo && configInfo.network && !util.isObjectEmpty(configInfo.network)) {
    network = Object.assign({}, util.obj2Json(configInfo.network))
  }
  if (network) {
    config += `,
        "network": ${util.obj2Json(network)}`
  }

  if (configInfo && configInfo.data && !util.isObjectEmpty(configInfo.data)) {
    config += `,
        "data" : ${util.obj2Json(configInfo.data)}`
  }

  if (configInfo && configInfo.background && !util.isObjectEmpty(configInfo.background)) {
    config += `,
        "background": ${util.obj2Json(configInfo.background)}`
  }

  if (config === '{') return ''
  config += `
      }`

  return config
}
