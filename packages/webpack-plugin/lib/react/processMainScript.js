// 该文件下的字符串语句需要使用 es5 语法
const addQuery = require('../utils/add-query')

const {
  stringifyRequest
} = require('./script-helper')

module.exports = function ({
  loaderContext
}, callback) {
  const { projectName } = loaderContext.getMpx()

  let output = 'import { AppRegistry } from \'react-native\'\n'
  // 此处可添加前置于App执行的语句
  output += `var App = require(${stringifyRequest(loaderContext, addQuery(loaderContext.resource, { isApp: true }))}).default\n`
  output += `AppRegistry.registerComponent(${JSON.stringify(projectName)}, () => App)\n`

  callback(null, {
    output
  })
}
