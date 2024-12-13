import * as wxLifecycle from '../platform/patch/lifecycle/index.wx'
import * as tenonLifecycle from '../platform/patch/lifecycle/index.tenon'
import { mergeLifecycle } from './mergeLifecycle'
import { error, isObject, diffAndCloneA, hasOwn } from '@mpxjs/utils'
import { implemented } from '../core/implement'
import { CREATED, UNMOUNTED } from '../core/innerLifecycle'

// 暂不支持的wx选项，后期需要各种花式支持
const unsupported = [
  'moved',
  'definitionFilter',
  'onShareAppMessage',
  'activated',
  'deactivated',
  'pageShow',
  'pageHide',
  'onPullDownRefresh',
  'onReachBottom',
  'onPageScroll',
  'onTabItemTap',
  'onResize',
  'onUnhandledRejection',
  'onThemeChange'
]

function convertErrorDesc (key) {
  error(`Options.${key} is not supported in runtime conversion from wx to tenon.`, global.currentResource)
}

function notSupportTip (options) {
  unsupported.forEach(key => {
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
  lifecycle2: mergeLifecycle(tenonLifecycle.LIFECYCLE),
  pageMode: 'blend',
  // support传递为true以将methods外层的方法函数合入methods中
  support: true,
  // wx输出tenon时额外将onLoad代理到CREATED
  lifecycleProxyMap: Object.assign({}, wxLifecycle.lifecycleProxyMap, {
    [CREATED]: ['created', 'attached', 'onLoad'],
    [UNMOUNTED]: ['destroyed', 'detached', 'onUnload', 'unmounted']
  }),
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
