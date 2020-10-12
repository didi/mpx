import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import * as webLifecycle from '../platform/patch/web/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'
import { error } from '../helper/log'
import { isObject, diffAndCloneA, getChainKeyOfObj, delChainKeyOfObj } from '../helper/utils'
import { implemented } from '../core/implement'

// 暂不支持的wx选项，后期需要各种花式支持
const NOTSUPPORTS = ['moved', 'relations', 'pageLifetimes.resize', 'definitionFilter', 'onPageNotFound', 'onShareAppMessage', 'pageShow', 'pageHide']

function convertErrorDesc (key) {
  error(`Options.${key} is not supported in runtime conversion from wx to web.`, global.currentResource)
}

function notSupportTip (options) {
  NOTSUPPORTS.forEach(key => {
    let optValue = getChainKeyOfObj(options, key)
    if (optValue) {
      if (!implemented[key]) {
        process.env.NODE_ENV !== 'production' && convertErrorDesc(key)
        delChainKeyOfObj(options, key)
      } else if (implemented[key].remove) {
        delChainKeyOfObj(options, key)
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
    '__created__': ['onLoad', 'created', 'attached'],
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
              // vue中对于引用类型数据需要使用函数返回
              newProp.default = isObject(prop.value) ? function propFn () {
                return diffAndCloneA(prop.value).clone
              } : prop.value
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
