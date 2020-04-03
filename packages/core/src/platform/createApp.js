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

  if (__mpx_mode__ === 'web') {
    global.currentOption = defaultOptions
  } else {
    const finalAppOption = dissolveAttrs(mergeOptions(rawOptions, 'app', false), 'methods')
    const ctor = global.currentCtor || App
    config.customCtor ? config.customCtor(finalAppOption) : ctor(finalAppOption)
  }
}
