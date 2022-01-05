import originalInstall from '@mpxjs/api-proxy-original'
import { compilePage } from './compile-page'
import pathUtils from './path-util'

export default function install (target, options = {}) {
  originalInstall(target, options)
  const monitorAPI = ['navigateTo', 'redirectTo', 'reLaunch']
  monitorAPI.forEach(method => {
    const originalMethod = target[method]
    target[method] = function (...args) {
      let url = args[0] && args[0].url
      if (url) {
        url = toAbsolutePath(url)
        notifyCompilingPage(url)
      }
      return originalMethod.apply(target, args)
    }
  })
}

const notifyCompilingPage = (path) => {
  compilePage(path)
}

const standardRelativePathReg = /^\.\/|^\.\.\//

const toAbsolutePath = (url = '') => {
  if (!pathUtils.isAbsolute(url)) { // 小程序相对定位
    if (!standardRelativePathReg.test(url)) {
      // 相对路径可以直接以目录或者文件开头
      url = `/pages/${url}`
      return url
    }
    const allPages = getCurrentPages()
    const currentPage = allPages[allPages.length - 1]
    if (currentPage) {
      url = pathUtils.join(pathUtils.dirname(currentPage.route), url)
    }
  }
  return url
}


export { getProxy } from '@mpxjs/api-proxy'