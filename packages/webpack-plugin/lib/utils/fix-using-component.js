const { capitalToHyphen } = require('./string')

module.exports = function (usingComponents, mode, warn) {
  // 百度和支付宝不支持大写组件标签名，统一转成带“-”和小写的形式。百度自带标签不会有带大写的情况
  if (usingComponents) {
    if (mode === 'ali' || mode === 'swan') {
      Object.keys(usingComponents).forEach(k => {
        const newK = capitalToHyphen(k)
        if (newK !== k) {
          if (usingComponents[newK]) {
            warn && warn(`Component name "${newK}" already exists, so component "${k}" can't be converted automatically and it isn't supported in ali/swan environment!`)
          } else {
            usingComponents[newK] = usingComponents[k]
            delete usingComponents[k]
          }
        }
      })
    }
  }
  return usingComponents
}
