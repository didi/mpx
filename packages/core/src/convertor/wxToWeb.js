import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import * as webLifecycle from '../platform/patch/web/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'
import { error } from '../helper/log'
import { implemented } from '../core/implement'

// 暂不支持的wx选项，后期需要各种花式支持
const NOTSUPPORTS = ['moved', 'relations', 'definitionFilter', 'onPageNotFound', 'onShareAppMessage', 'onTabItemTap', 'onResize', 'pageShow', 'pageHide']

function convertErrorDesc (key) {
  error(`Options.${key} is not supported in runtime conversion from wx to web.`, global.currentResource)
}

function notSupportTip (options) {
  NOTSUPPORTS.forEach(key => {
    if (options[key]) {
      if (!implemented[key]) {
        process.env.NODE_ENV !== 'production' && convertErrorDesc(key)
        delete options[key]
      } else if (implemented[key].remove) {
        delete options[key]
      }
    }
  })
}

export default {
  lifecycle: mergeLifecycle(wxLifecycle.LIFECYCLE),
  lifecycle2: mergeLifecycle(webLifecycle.LIFECYCLE),
  pageMode: 'blend',
  // support传递为true以将methods外层的方法函数合入methods中
  support: true,
  lifecycleProxyMap: {
    '__created__': ['onLaunch', 'onLoad', 'created', 'attached'],
    '__mounted__': ['ready', 'onReady'],
    '__destroyed__': ['detached', 'onUnload'],
    '__updated__': ['updated'],
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
