import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'

const NOTSUPPORTS = ['moved', 'relations', 'pageLifetimes', 'definitionFilter']

// relations和pageLifetimes后续估计可以花式支持

function convertErrorDesc (key) {
  console.error(`【MPX CONVERT ERROR】at ${global.currentResource || ''} : Don't support for convert the option【${key}】 of the wx-component into the web-component`)
}

function notSupportTip (options) {
  NOTSUPPORTS.forEach(key => {
    if (options[key]) {
      convertErrorDesc(key)
      delete options[key]
    }
  })
}

// 暂不支持的wx生命周期，后期需要各种花式支持
// const NOTSUPPORTED_APP_HOOKS = [
//   'onShow',
//   'onHide',
//   'onPageNotFound'
// ]
//
// const NOTSUPPORTED_PAGE_HOOKS = [
//   'onShow',
//   'onHide',
//   'onPullDownRefresh',
//   'onReachBottom',
//   'onShareAppMessage',
//   'onPageScroll',
//   'onTabItemTap',
//   'onResize'
// ]
//
// const NOTSUPPORTED_COMPONENT_HOOKS = [
//   'moved',
//   'pageShow',
//   'pageHide',
// ]

export default {
  lifecycle: mergeLifecycle(wxLifecycle.LIFECYCLE),
  pageMode: 'blend',
  support: false,
  lifecycleProxyMap: {
    'created': ['onLaunch', 'onLoad', 'attached'],
    'mounted': ['ready', 'onReady'],
    'destroyed': ['detached', 'onUnload'],
    'errorCaptured': ['onError']
  },
  convert (options) {
    if (options.properties) {
      const newProps = {}
      Object.keys(options.properties).forEach(key => {
        const prop = options.properties[key]
        if (prop) {
          if (prop.hasOwnProperty('type')) {
            const newProp = {}
            if (prop.hasOwnProperty('optionalTypes')) {
              newProp.type = [prop.type, ...prop.optionalTypes]
            } else {
              newProp.type = prop.type
            }
            if (prop.hasOwnProperty('value')) {
              newProp.default = prop.value
            }
            newProps[key] = newProp
          } else {
            newProps[key] = prop
          }
        }
      })
      options.props = Object.assign(newProps, options.props)
      delete options.properties
    }
    notSupportTip(options)
  }
}
