import { isWebBundle, isRainbow } from './env'
import { isType } from './utils'
import { DRIVER_HOME_PAGE } from './constants'
import { Bridge } from '@didi/driver-biz-mp-sdk'
import mpx from '@mpxjs/core'

export function urlParse (url = '') {
  const reg = /[?&][^?&]+=[^?&]+/g
  const arr = url.match(reg)
  let obj = {}
  if (arr) {
    arr.forEach(item => {
      let tempArr = item.substring(1).split('=')
      let key = decodeURIComponent(tempArr[0])
      let val = decodeURIComponent(tempArr[1])
      obj[key] = val
    })
  }
  return obj
}

// 解析 href
export function parseQuery () {
  const hash = urlParse(window.location.hash)
  const search = urlParse(window.location.search)

  return {
    ...search,
    ...hash
  }
}

export const buildUrl = (url, params = {}) => {
  const paramsStr = urlParamsSerialization(params)
  const separator = paramsStr
    ? url.indexOf('?') > -1
      ? '&' : '?'
    : ''
  return `${url}${separator}${paramsStr}`
}

export const urlParamsSerialization = (obj, isEncode) => {
  isEncode = isEncode !== false
  let url = ''
  if (isType(obj) === 'Object') {
    for (var k in obj) {
      let value = obj[k] !== undefined ? obj[k] : ''
      if (value === '') continue
      url += '&' + k + '=' + (isEncode ? encodeURIComponent(value) : value)
    }
  }
  return url ? url.substring(1) : ''
}

export const universelPageJump = (url, params = {}) => {
  const launchDriverApp = (url) => {
    const schema = `https://static.udache.com/agility-sdk/pages/invoke/jump-driver.html?page=jump&h5=true&url=${encodeURIComponent(url)}`
    window.location.href = schema
  }
  if (isWebBundle) {
    if (isRainbow) {
      // 跳到司机车主首页
      if (url === DRIVER_HOME_PAGE) {
        window.location.href = 'https://v.didi.cn/bwLDma9'
        return
      }
      // 运行在司机部落，需要拉起司机车主app
      launchDriverApp(buildUrl(url, params))
    } else if (DRIVER_HOME_PAGE === url) { // 司机端首页
      Bridge.toHomePage()
    } else { // 运行在司机端或者 h5 环境，那就纯跳转
      window.location.href = buildUrl(url, params)
    }
  } else { // 走微信客服会话打开主会场页面
    return true
  }
}

// 微信 web-view 组件打开或者 href 跳转目标页面
export const hrefOrOpenWithWebview = (url, params) => {
  if (isWebBundle) {
    window.location.href = buildUrl(url, params)
  } else {
    // 这个 page 由司机招募小程序提供，目前主会场作为司机招募的分包小程序
    mpx.navigateTo({
      url: '/pages/webview-page/index?url=' + encodeURIComponent(buildUrl(url, params))
    })
  }
}
