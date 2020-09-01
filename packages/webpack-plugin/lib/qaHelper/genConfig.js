/*
*** 生成manifest文件config部分，https://doc.quickapp.cn/framework/manifest.html
 */

module.exports = function genConfig(configInfo) {
  let config = `{`
  if (configInfo && configInfo.logLevel) {
    config += `
        "logLevel": "${configInfo.logLevel}"`
  }
  if (configInfo && configInfo.designWidth) {
    config += `,
        "designWidth": ${configInfo.designWidth}`
  }
  if (configInfo && configInfo.network) {
    config += `,
        "network": ${JSON.stringify(configInfo.network)}`
  }
  if (configInfo && configInfo.data) {
      config += `,
        "data" : ${JSON.stringify(configInfo.data)}`
  }
  if (configInfo && configInfo.background) {
      config += `,
        "background": ${JSON.stringify(configInfo.background)}`
  }
  if (config === '{') return ''
  config += `
      }` 

  return config
}