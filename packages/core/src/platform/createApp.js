import transferOptions from '../core/transferOptions'
import mergeOptions from '../core/mergeOptions'
import builtInKeysMap from './patch/builtInKeysMap'
import { makeMap, spreadProp } from '@mpxjs/utils'
import * as webLifecycle from '../platform/patch/web/lifecycle'
import Mpx from '../index'

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
  // 在App中挂载mpx对象供周边工具访问，如e2e测试
  const builtInMixins = [{
    getMpx () {
      return Mpx
    }
  }]
  const appData = {}
  if (__mpx_mode__ === 'web') {
    builtInMixins.push({
      created () {
        Object.assign(this, Mpx.prototype)
        Object.assign(this, appData)
        const current = (global.__mpxRouter && global.__mpxRouter.currentRoute) || {}
        const options = {
          path: current.path && current.path.replace(/^\//, ''),
          query: current.query,
          scene: 0,
          shareTicket: '',
          referrerInfo: {}
        }
        this.$options.onLaunch && this.$options.onLaunch.call(this, options)
        global.__mpxAppCbs = global.__mpxAppCbs || {
          show: [],
          hide: [],
          error: []
        }
        if (this.$options.onShow) {
          this.$options.onShow.call(this, options)
          global.__mpxAppCbs.show.push(this.$options.onShow.bind(this))
        }
        if (this.$options.onHide) {
          global.__mpxAppCbs.hide.push(this.$options.onHide.bind(this))
        }
        if (this.$options.onError) {
          global.__mpxAppCbs.error.push(this.$options.onError.bind(this))
        }
      }
    })
  } else {
    builtInMixins.push({
      onLaunch () {
        Object.assign(this, Mpx.prototype)
      }
    })
  }
  // app选项目前不需要进行转换
  const { rawOptions } = transferOptions(option, 'app', false)
  rawOptions.mixins = builtInMixins
  const defaultOptions = filterOptions(spreadProp(mergeOptions(rawOptions, 'app', false), 'methods'), appData)

  if (__mpx_mode__ === 'web') {
    global.__mpxOptionsMap = global.__mpxOptionsMap || {}
    global.__mpxOptionsMap[global.currentModuleId] = defaultOptions
    global.getApp = function () {
      return appData
    }
  } else {
    const ctor = config.customCtor || global.currentCtor || App
    ctor(defaultOptions)
  }
}
