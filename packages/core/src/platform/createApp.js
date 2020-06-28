import transferOptions from '../core/transferOptions'
import mergeOptions from '../core/mergeOptions'
import { dissolveAttrs } from '../helper/utils'

export default function createApp (option, config = {}) {
  const { rawOptions } = transferOptions(option, 'app', [{
    onLaunch () {
      Object.assign(this, option.proto)
    }
  }])
  const defaultOptions = mergeOptions(rawOptions, 'app', false)

  if (__mpx_mode__ === 'web' || __mpx_mode__ === 'qa') {
    global.currentOption = defaultOptions
    global.getApp = function () {
      return defaultOptions
    }
  } else {
    const finalAppOption = dissolveAttrs(defaultOptions, 'methods')
    const ctor = config.customCtor || global.currentCtor || App
    ctor(finalAppOption)
  }
}
