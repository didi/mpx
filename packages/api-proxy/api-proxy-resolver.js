// const path = require('path')

// 一筹莫展的时候发现了
module.exports = (reqPath, options) => {
  const reg = /^\.\/api\/(.*)/g
  const resolverList = ['toast', 'action-sheet', 'storage', 'modal']
  let realPath = reqPath
  resolverList.forEach((item) => {
    if (reg.test(realPath) && reqPath.includes(item)) {
      realPath = reqPath + '/index.web'
    }
  })
  return options.defaultResolver(realPath, {
    ...options
  })
}
