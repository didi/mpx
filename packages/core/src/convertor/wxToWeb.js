import * as wxLifecycle from '../platform/patch/lifecycle/index.wx'
import { LIFECYCLE } from '../platform/patch/lifecycle/index'
import { mergeLifecycle } from './mergeLifecycle'
import {
  isObject,
  diffAndCloneA,
  error,
  hasOwn,
  isDev
} from '@mpxjs/utils'
import { implemented } from '../core/implement'

// 暂不支持的wx选项，后期需要各种花式支持
const unsupported = ['moved', 'definitionFilter', 'onShareAppMessage']

function convertErrorDesc (key) {
  error(`Options.${key} is not supported in runtime conversion from wx to web.`, global.currentResource || global.currentModuleId)
}

function notSupportTip (options) {
  unsupported.forEach(key => {
    if (options[key]) {
      if (!implemented[key]) {
        isDev && convertErrorDesc(key)
        delete options[key]
      } else if (implemented[key].remove) {
        delete options[key]
      }
    }
  })
}

export default {
  lifecycle: mergeLifecycle(wxLifecycle.LIFECYCLE),
  lifecycle2: mergeLifecycle(LIFECYCLE),
  pageMode: 'blend',
  support: true,
  lifecycleProxyMap: wxLifecycle.lifecycleProxyMap,
  convert (options) {
    const props = Object.assign({}, options.properties, options.props)
    if (props) {
      Object.keys(props).forEach(key => {
        const prop = props[key]
        if (prop) {
          if (hasOwn(prop, 'type')) {
            const newProp = {}
            if (hasOwn(prop, 'optionalTypes')) {
              newProp.type = [prop.type, ...prop.optionalTypes]
            } else {
              newProp.type = prop.type
            }
            if (hasOwn(prop, 'value')) {
              // vue中对于引用类型数据需要使用函数返回
              newProp.default = isObject(prop.value)
                ? function propFn () {
                  return diffAndCloneA(prop.value).clone
                }
                : prop.value
            }
            props[key] = newProp
          } else {
            props[key] = prop
          }
        }
      })
      options.props = props
      delete options.properties
    }
    notSupportTip(options)
  }
}
