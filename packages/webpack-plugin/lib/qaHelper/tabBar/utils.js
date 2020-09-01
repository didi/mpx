const config = require('../../config')

// 通过pagePath取最后2层作为key
export const genQaComponentKey = (pagePath) => {
  let strPath = pagePath.split('/').reverse().slice(0, 2).join('')
  return strPath
}
export const processJson = (json) => {
  let tabBarCfg = config['qa'].tabBar
  let itemKey = tabBarCfg.itemKey
  if (json.tabBar && json.tabBar[itemKey]) {
    json.tabBar[itemKey].forEach((item) => {
      let strKey = genQaComponentKey(item.pagePath)
      json.usingComponents[strKey] = item.pagePath
    })
  }
}
