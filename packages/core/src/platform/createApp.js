import transferOptions from '../core/transferOptions'
import mergeOptions from '../core/mergeOptions'
import builtInKeysMap from './patch/builtInKeysMap'
import { makeMap, getUrlQueryParams } from '../helper/utils'
import * as webLifecycle from '../platform/patch/web/lifecycle'

const webAppHooksMap = makeMap(webLifecycle.LIFECYCLE.APP_HOOKS)

function filterOptions (options, appData) {
  const newOptions = {}
  Object.keys(options).forEach(key => {
    if (builtInKeysMap[key]) {
      return
    }
    if (__mpx_mode__ === 'web' && !webAppHooksMap[key]) {
      appData[key] = options[key]
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
}

export default function createApp (option, config = {}) {
  const builtInMixins = []
  const appData = {}
  if (__mpx_mode__ === 'web') {
    const currentUrl = window.location.href
    const urlQueryParams = getUrlQueryParams(currentUrl)
    const options = {
      path: currentUrl,
      query: urlQueryParams,
      scene: 0, // 有待确定
      shareTicket: '', // 有待确定
      referrerInfo: {}
    }
    builtInMixins.push({
      created () {
        Object.assign(this, option.proto)
        Object.assign(this, appData)
        this.$options.onLaunch && this.$options.onLaunch.call(this, options)
        global.__mpxAppCbs = global.__mpxAppCbs || {
          show: [],
          hide: []
        }
        if (this.$options.onShow) {
          this.$options.onShow.call(this, options)
          global.__mpxAppCbs.show.push(this.$options.onShow.bind(this))
        }
        if (this.$options.onHide) {
          global.__mpxAppCbs.hide.push(this.$options.onHide.bind(this))
        }
      }
    })
  } else {
    builtInMixins.push({
      onLaunch () {
        Object.assign(this, option.proto)
      }
    })
  }
  const { rawOptions } = transferOptions(option, 'app', builtInMixins)
  const defaultOptions = filterOptions(mergeOptions(rawOptions, 'app', false), appData)

  if (__mpx_mode__ === 'web') {
    global.currentOption = defaultOptions
    global.getApp = function () {
      return appData
    }
  } else {
    const ctor = config.customCtor || global.currentCtor || App
    ctor(defaultOptions)
  }
}
