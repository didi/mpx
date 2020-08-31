/*
*** 生成manifest文件config部分，https://doc.quickapp.cn/framework/manifest.html
 */

module.exports = function genConfig(configInfo) {
  let config = `{
        "logLevel": "${configInfo && configInfo.logLevel || 'log'}",
        "designWidth": ${configInfo && configInfo.designWidth || 750},
        "network": {
          "connectTimeout": ${configInfo && configInfo.network.connectTimeout || 30000},
          "readTimeout": ${configInfo && configInfo.network.readTimeout || 30000},
          "writeTimeout": ${configInfo && configInfo.network.writeTimeout || 30000}
        }`
  if (configInfo && configInfo.data) {
      config += `,`
      config += `
        "data" : ${JSON.stringify(configInfo.data)}`
  }
  if (configInfo && configInfo.background) {
      config += `,`
      config += `
        "background": ${JSON.stringify(configInfo.background)}`
  }
  config += `
      }` 

  return config
}