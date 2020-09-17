import transferOptions from '../core/transferOptions'
import mergeOptions from '../core/mergeOptions'
import builtInKeysMap from './patch/builtInKeysMap'
import { makeMap } from '../helper/utils'
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
    builtInMixins.push({
      created () {
        Object.assign(this, option.proto)
        Object.assign(this, appData)
        this.$options.onLaunch && this.$options.onLaunch.call(this, {})
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
