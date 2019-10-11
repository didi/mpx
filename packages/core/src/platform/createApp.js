import transferOptions from '../core/transferOptions'
import mergeOptions from '../core/mergeOptions'
import { dissolveAttrs, extend } from '../helper/utils'

export default function createApp (option) {
  const { rawOptions } = transferOptions(option, 'app', [{
    onLaunch () {
      extend(this, option.proto)
    }
  }])

  const defaultOptions = mergeOptions(rawOptions, 'app', false)

  if (__mpx_mode__ === 'web') {
    global.currentOption = defaultOptions
  } else {
    global.currentCtor(dissolveAttrs(defaultOptions, 'methods'))
  }
}
