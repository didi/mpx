import transferOptions from '../core/transferOptions'
import mergeOptions from '../core/mergeOptions'
import builtInKeysMap from './patch/builtInKeysMap'
import { makeMap, spreadProp, isBrowser } from '@mpxjs/utils'
import { mergeLifecycle } from '../convertor/mergeLifecycle'
import { LIFECYCLE } from '../platform/patch/lifecycle/index'
import Mpx from '../index'
import { initAppProvides } from './export/inject'

const appHooksMap = makeMap(mergeLifecycle(LIFECYCLE).app)

function filterOptions (options, appData) {
  const newOptions = {}
  Object.keys(options).forEach(key => {
    if (builtInKeysMap[key]) {
      return
    }
    if (__mpx_mode__ === 'web' && !appHooksMap[key] && key !== 'provide') {
      appData[key] = options[key]
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
}

export default function createApp (options, config = {}) {
  const appData = {}
  // app选项目前不需要进行转换
  const { rawOptions, currentInject } = transferOptions(options, 'app', false)
  const builtInMixins = [{
    // 在App中挂载mpx对象供周边工具访问，如e2e测试
    getMpx () {
      return Mpx
    }
  }]
  if (__mpx_mode__ === 'web') {
    builtInMixins.push({
      beforeCreate () {
        // for vue provide vm access
        Object.assign(this, appData, Mpx.prototype)
        if (isBrowser) {
          rawOptions.onShow && mpxGlobal.__mpxAppCbs.show.push(rawOptions.onShow.bind(this))
          rawOptions.onHide && mpxGlobal.__mpxAppCbs.hide.push(rawOptions.onHide.bind(this))
          rawOptions.onError && mpxGlobal.__mpxAppCbs.error.push(rawOptions.onError.bind(this))
          rawOptions.onUnhandledRejection && mpxGlobal.__mpxAppCbs.rejection.push(rawOptions.onUnhandledRejection.bind(this))
        }
      },
      created () {
        const current = this.$root.$options?.router?.currentRoute || {}
        const options = {
          path: current.path && current.path.replace(/^\//, ''),
          query: current.query,
          scene: 0,
          shareTicket: '',
          referrerInfo: {}
        }
        // web不分冷启动和热启动
        global.__mpxEnterOptions = options
        global.__mpxLaunchOptions = options
        rawOptions.onLaunch && rawOptions.onLaunch.call(this, options)
        global.__mpxAppCbs.show.forEach((cb) => {
          cb(options)
        })
      }
    })
  } else {
    builtInMixins.push({
      onLaunch () {
        Object.assign(this, Mpx.prototype)
        initAppProvides(rawOptions.provide, this)
      }
    })
  }
  rawOptions.mixins = builtInMixins
  const defaultOptions = filterOptions(spreadProp(mergeOptions(rawOptions, 'app', false), 'methods'), appData)

  if (__mpx_mode__ === 'web') {
    global.getApp = function () {
      if (!isBrowser) {
        console.error('[Mpx runtime error]: Dangerous API! global.getApp method is running in non browser environments')
      }
      return appData
    }
    global.__mpxOptionsMap = global.__mpxOptionsMap || {}
    global.__mpxOptionsMap[currentInject.moduleId] = defaultOptions
  } else {
    defaultOptions.onAppInit && defaultOptions.onAppInit()
    const ctor = config.customCtor || global.currentCtor || App
    ctor(defaultOptions)
  }
}
