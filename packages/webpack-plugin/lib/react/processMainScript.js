// 该文件下的字符串语句需要使用 es5 语法
const addQuery = require('../utils/add-query')
const {
  stringifyRequest,
  buildI18n
} = require('./script-helper')

module.exports = function ({
  loaderContext
}, callback) {
  const { i18n } = loaderContext.getMpx()

  let output = 'import { AppRegistry } from \'react-native\'\n'

  if (i18n) {
    output += buildI18n({ loaderContext })
  }
  // 此处可添加前置于App执行的语句
  output += `var App = require(${stringifyRequest(loaderContext, addQuery(loaderContext.resource, { isApp: true }))}).default\n`
  // output += `AppRegistry.registerComponent(${JSON.stringify(projectName)}, () => App)\n`
  output += 'exports.default = App\n'

  callback(null, {
    output
  })
}
