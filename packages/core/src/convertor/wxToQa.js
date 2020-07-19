import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import * as qaLifecycle from '../platform/patch/qa/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'
import { error } from '../helper/log'
import { implemented } from '../core/implement'

const NOTSUPPORTS = ['relations', 'onResize', 'moved', 'definitionFilter', 'onPageNotFound', 'onPullDownRefresh', 'onReachBottom', 'onShareAppMessage', 'onPageScroll', 'onTabItemTap']

function convertErrorDesc (key) {
  error(`Options.${key} is not supported in runtime conversion from wx to qa.`, global.currentResource)
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
  lifecycle2: mergeLifecycle(qaLifecycle.LIFECYCLE),
  pageMode: 'blend',
  support: false,
  lifecycleProxyMap: {
    '__created__': ['onLaunch', 'onLoad', 'created', 'attached'],
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
    notSupportTip(options)
  }
}
