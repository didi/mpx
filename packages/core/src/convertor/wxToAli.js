import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import * as aliLifecycle from '../platform/patch/ali/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'
import { mergeToArray } from '../core/mergeOptions'
import { error } from '../helper/log'
import { implemented } from '../core/implement'
import { hasOwn } from '../helper/utils'
import { CREATED } from '../core/innerLifecycle'

const unsupported = ['moved', 'definitionFilter']

function convertErrorDesc (key) {
  error(`Options.${key} is not supported in runtime conversion from wx to ali.`, global.currentResource)
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
  // relations部分支持
  const relations = options['relations']
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
  lifecycle2: mergeLifecycle(aliLifecycle.LIFECYCLE),
  pageMode: 'blend',
  support: false,
  // wx输出ali时额外将onLoad代理到CREATED
  lifecycleProxyMap: Object.assign({}, wxLifecycle.lifecycleProxyMap, {
    [CREATED]: ['created', 'attached', 'onload']
  }),
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
    if (options.onResize) {
      mergeToArray(options, {
        events: {
          onResize: options.onResize
        }
      }, 'events')
      delete options.onResize
    }
    notSupportTip(options)
  }
}
