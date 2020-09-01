const { capitalToHyphen } = require('./string')
const { genQaComponentKey } = require('../qaHelper/tabBar/processJSON')

module.exports = function ({ usingComponents, mode, log }) {
  // 百度和支付宝不支持大写组件标签名，统一转成带“-”和小写的形式。百度自带标签不会有带大写的情况
  if (usingComponents) {
    if (mode === 'ali' || mode === 'swan') {
      Object.keys(usingComponents).forEach(k => {
        const newK = capitalToHyphen(k)
        if (newK !== k) {
          if (usingComponents[newK]) {
            log && log(`Component name "${newK}" already exists, so component "${k}" can't be converted automatically and it isn't supported in ali/swan environment!`)
          } else {
            const pathValue = usingComponents[k]
            usingComponents[newK] = pathValue
            delete usingComponents[k]
          }
        }
      })
    }
  }
  // 快应用tabBar
  if (mode === 'qa') {
    let tabBarCfg = config['qa'].tabBar
    let itemKey = tabBarCfg.itemKey
    if (json.tabBar && json.tabBar[itemKey]) {
      json.tabBar[itemKey].forEach((item) => {
        let strKey = genQaComponentKey(item.pagePath)
        json.usingComponents[strKey] = item.pagePath
      })
    }
  }
  return usingComponents
}
