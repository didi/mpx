/* eslint-disable prefer-promise-reject-errors */
/**
 *@file 路由相关API
 *@export
 **/
// 此处引入先用webpack externals处理
import router from 'qAppRouter'
import {
  urlHandler
} from '../../common/js'

function redirectTo (options = {}) {
  const {
    url
  } = options
  const {
    link,
    params
  } = urlHandler(url)
  try {
    router.replace({
      uri: link,
      params
    })
    return Promise.resolve({
      msg: 'redirectTo:ok'
    })
  } catch (err) {
    return Promise.reject({
      errMsg: 'redirectTo:error'
    })
  }
}

function navigateTo (options = {}) {
  const {
    url
  } = options
  const {
    link,
    params
  } = urlHandler(url)
  try {
    router.push({
      uri: link,
      params
    })
    return Promise.resolve({
      msg: 'navigateTo:ok'
    })
  } catch (err) {
    return Promise.reject({
      errMsg: 'navigateTo:error'
    })
  }
}

function navigateBack ({
  delta = 1
}) {
  const pageArr = router.getPages()
  const link = pageArr[pageArr.length - delta - 1] ? pageArr[pageArr.length - delta - 1].path : ''
  try {
    router.back({
      path: link
    })
    return Promise.resolve({
      msg: 'navigateBack:ok'
    })
  } catch (err) {
    return Promise.reject({
      errMsg: 'navigateBack:error'
    })
  }
}
/**
 * 携带 clearTask 时启动目标页面会清除此页面外的其他页面，存在多个目标页面时只保留最先打开的目标页面并回调 onRefresh 生命周期。如不存在目标页面时将清除所有页面并新建目标页面实例
 */
function reLaunch (options = {}) {
  const {
    url
  } = options
  const {
    link,
    params
  } = urlHandler(url)
  try {
    router.push({
      uri: link,
      params: {
        ___PARAM_LAUNCH_FLAG___: 'clearTask',
        ...params
      }
    })
    return Promise.resolve({
      msg: 'reLaunch:ok'
    })
  } catch (err) {
    return Promise.reject({
      errMsg: 'reLaunch:error'
    })
  }
}

function switchTab ({
  url,
  params
}) {
  console.warn('快应用需要自己处理custom-tab-bar文件中切换选项，进行渲染')
}
export {
  navigateTo,
  navigateBack,
  redirectTo,
  reLaunch,
  switchTab
}
