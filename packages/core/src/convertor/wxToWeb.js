import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import * as webLifecycle from '../platform/patch/web/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'
import { type } from '../helper/utils'
import { error } from '../helper/log'

const NOTSUPPORTS = ['moved', 'relations', 'pageLifetimes', 'definitionFilter']

// relations和pageLifetimes后续估计可以花式支持

function convertErrorDesc (key) {
  error(`Option[${key}] is not supported in runtime conversion from wx to web.`, global.currentResource)
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
  lifecycle2: mergeLifecycle(webLifecycle.LIFECYCLE),
  pageMode: 'blend',
  // support传递为true以将methods外层的方法函数合入methods中
  support: true,
  // todo 支持onpagenotfound
  lifecycleProxyMap: {
    '__created__': ['onLaunch', 'onLoad', 'created', 'attached'],
    '__mounted__': ['ready', 'onReady'],
    '__destroyed__': ['detached', 'onUnload'],
    '__updated__': ['updated'],
    '__show__': ['onShow'],
    '__hide__': ['onHide'],
    'errorCaptured': ['onError']
  },
  convert (options) {
    if (options.data && type(options.data) !== 'Function') {
      const rawData = options.data
      /* eslint-disable no-new-func */
      options.data = new Function(`return ${JSON.stringify(rawData)};`)
    }
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
