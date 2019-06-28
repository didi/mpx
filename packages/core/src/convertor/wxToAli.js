import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'

const NOTSUPPORTS = ['moved', 'pageLifetimes', 'definitionFilter']

function convertErrorDesc (key) {
  console.error(`【MPX CONVERT ERROR】at ${global.currentResource || ''} : Don't support for convert the option【${key}】 of the wx-component into the ali-component`)
}

function notSupportTip (options) {
  NOTSUPPORTS.forEach(key => {
    if (options[key]) {
      convertErrorDesc(key)
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
  mode: 'blend',
  support: false,
  lifecycleProxyMap: {
    '__created__': ['created', 'attached'],
    '__mounted__': ['ready', 'onReady'],
    '__destroyed__': ['detached'],
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
