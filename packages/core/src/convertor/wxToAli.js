import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import * as aliLifecycle from '../platform/patch/ali/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'

const NOTSUPPORTS = ['moved', 'definitionFilter']

function convertErrorDesc (key) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`【MPX CONVERT ERROR】at ${global.currentResource || ''} : Don't support for convert the option【${key}】 of the wx-component into the ali-component`)
  }
}

function notSupportTip (options) {
  NOTSUPPORTS.forEach(key => {
    if (options[key]) {
      process.env.NODE_ENV !== 'production' && convertErrorDesc(key)
      delete options[key]
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
  lifecycleProxyMap: {
    '__created__': ['onLoad', 'created', 'attached'],
    '__mounted__': ['ready', 'onReady'],
    '__destroyed__': ['detached', 'onUnload'],
    '__updated__': ['updated']
  },
  convert (options) {
    if (options.properties) {
      const newProps = {}
      Object.keys(options.properties).forEach(key => {
        const prop = options.properties[key]
        if (prop && prop.hasOwnProperty('value')) {
          newProps[key] = prop.value
        } else {
          newProps[key] = typeof prop === 'function' ? prop() : null
        }
      })
      options.props = Object.assign(newProps, options.props)
      delete options.properties
    }
    notSupportTip(options)
  }
}
