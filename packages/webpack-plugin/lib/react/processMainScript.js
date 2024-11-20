// 该文件下的字符串语句需要使用 es5 语法
const addQuery = require('../utils/add-query')
const {
  stringifyRequest,
  buildI18n
} = require('./script-helper')

module.exports = function ({
                             loaderContext
                           }, callback) {
  const { i18n, rnConfig } = loaderContext.getMpx()
  
  let output = 'import { AppRegistry } from \'react-native\'\n'
  
  if (i18n) {
    output += buildI18n({ loaderContext })
  }
  // 此处可添加前置于App执行的语句
  output += `var app = require(${stringifyRequest(loaderContext, addQuery(loaderContext.resource, { isApp: true }))}).default\n`
  if (rnConfig.projectName) {
    output += `AppRegistry.registerComponent(${JSON.stringify(rnConfig.projectName)}, () => app)\n`
  } else {
    output += 'export default app\n'
  }
  
  callback(null, {
    output
  })
}
