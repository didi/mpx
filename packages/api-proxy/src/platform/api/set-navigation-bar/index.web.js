import { isBrowser, envError, throwSSRWarning, successHandle, failHandle } from '../../../common/js'
import Vue from 'vue'

function updatePageConfig (config) {
  const page = typeof getCurrentPages === 'function' && getCurrentPages().slice(-1)[0]
  const pageConfig = page?.$options?.__mpxPageConfig
  if (!pageConfig) {
    return false
  }
  Object.keys(config).forEach((key) => {
    Vue.set(pageConfig, key, config[key])
  })
  return true
}

function setNavigationBarTitle (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('setNavigationBarTitle API is running in non browser environments')
    return
  }
  const { title, success, fail, complete } = options
  if (!updatePageConfig({ navigationBarTitleText: title })) {
    failHandle({ errMsg: 'setNavigationBarTitle:fail page instance is unavailable' }, fail, complete)
    return
  }
  if (document.title !== title) {
    document.title = title
  }

  successHandle({ errMsg: 'setNavigationBarTitle:ok' }, success, complete)
}

function setNavigationBarColor (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('setNavigationBarColor API is running in non browser environments')
    return
  }
  const { frontColor = '', backgroundColor = '', success, fail, complete } = options
  if (!['#ffffff', '#000000'].includes(frontColor) || !/^#[\da-fA-F]{3}([\da-fA-F]{3})?$/.test(backgroundColor)) {
    failHandle({ errMsg: 'setNavigationBarColor:fail invalid color' }, fail, complete)
    return
  }
  if (!updatePageConfig({
    navigationBarBackgroundColor: backgroundColor,
    navigationBarTextStyle: frontColor === '#ffffff' ? 'white' : 'black'
  })) {
    failHandle({ errMsg: 'setNavigationBarColor:fail page instance is unavailable' }, fail, complete)
    return
  }
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', backgroundColor)
  successHandle({ errMsg: 'setNavigationBarColor:ok' }, success, complete)
}

const hideHomeButton = envError('hideHomeButton')

export {
  setNavigationBarTitle,
  setNavigationBarColor,
  hideHomeButton
}
