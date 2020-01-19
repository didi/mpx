import transferOptions from '../core/transferOptions'
import mergeOptions from '../core/mergeOptions'
import { dissolveAttrs, extend } from '../helper/utils'

export default function createApp (option, config = {}) {
  const { rawOptions } = transferOptions(option, 'app', [{
    onLaunch () {
      extend(this, option.proto)
    }
  }])
  const defaultOptions = mergeOptions(rawOptions, 'app', false)
  const ctor = global.currentCtor || App

  if (__mpx_mode__ === 'web') {
    global.currentOption = defaultOptions
  } else {
    const finalAppOption = dissolveAttrs(mergeOptions(rawOptions, 'app', false), 'methods')
    config.customCtor ? config.customCtor(finalAppOption) : ctor(finalAppOption)
  }
}
