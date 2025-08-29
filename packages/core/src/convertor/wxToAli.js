import * as wxLifecycle from '../platform/patch/lifecycle/index.wx'
import { LIFECYCLE } from '../platform/patch/lifecycle/index'
import { mergeLifecycle } from './mergeLifecycle'
import { error, hasOwn, isDev } from '@mpxjs/utils'
import { implemented } from '../core/implement'

const unsupported = ['moved', 'definitionFilter']

function convertErrorDesc (key) {
  error(`Options.${key} is not supported in runtime conversion from wx to ali.`, global.currentResource || global.currentModuleId)
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
  // relations部分支持
  const relations = options.relations
  if (relations) {
    Object.keys(relations).forEach(path => {
      const item = relations[path]
      if (item.target) {
        convertErrorDesc('relations > target')
      }
      if (item.linkChanged) {
        convertErrorDesc('relations > linkChanged')
      }
    })
  }
}

export default {
  lifecycle: mergeLifecycle(wxLifecycle.LIFECYCLE),
  lifecycle2: mergeLifecycle(LIFECYCLE),
  pageMode: 'blend',
  support: false,
  lifecycleProxyMap: wxLifecycle.lifecycleProxyMap,
  convert (options) {
    const props = Object.assign({}, options.properties, options.props)
    if (props) {
      Object.keys(props).forEach(key => {
        const prop = props[key]
        if (prop) {
          if (hasOwn(prop, 'value')) {
            props[key] = prop.value
          } else {
            const type = hasOwn(prop, 'type') ? prop.type : prop
            if (typeof type === 'function') props[key] = type()
          }
        }
      })
      options.props = props
      delete options.properties
    }
    notSupportTip(options)
  }
}
