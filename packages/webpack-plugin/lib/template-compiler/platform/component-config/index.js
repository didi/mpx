const view = require('./view')

module.exports = function getComponentConfigs ({ warn, error }) {
  // 转换规则只需以微信为基准配置微信和支付宝的差异部分，比如微信和支付宝都支持但是写法不一致，或者微信支持而支付宝不支持的部分(抛出错误或警告)
  return [
    view({ warn, error })
  ]
}
