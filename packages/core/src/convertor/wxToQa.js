import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import * as qaLifecycle from '../platform/patch/qa/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'
import { mergeToArray } from '../core/mergeOptions'
import { error } from '../helper/log'

const NOTSUPPORTS = ['moved', 'definitionFilter']

function convertErrorDesc (key) {
  error(`Options.${key} is not supported in runtime conversion from wx to qa.`, global.currentResource)
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
  lifecycle2: mergeLifecycle(qaLifecycle.LIFECYCLE),
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
      const newProps = Object.create(null)
      Object.keys(options.properties).forEach(key => {
        const prop = options.properties[key]
        const type = prop.hasOwnProperty('type') && prop.type
        if (type[prop] === 'Object') {
          if (prop.hasOwnProperty('value')) {
            newProps[key] = (type && type === 'Function') ? Object.assign({}, { default: prop.value() }) : Object.assign({}, { default: prop.value })
          }
        } else {
          newProps[key] = prop
        }
      })
      options.props = Object.assign(newProps, options.props)
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
