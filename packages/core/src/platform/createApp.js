import transferOptions from '../core/transferOptions'
import mergeOptions from '../core/mergeOptions'
import { dissolveAttrs, extend } from '../helper/utils'

export default function createApp (option, config = {}) {
  const { rawOptions } = transferOptions(option, 'app', [{
    onLaunch () {
      extend(this, option.proto)
    }
  }])
  const finalAppOption = dissolveAttrs(mergeOptions(rawOptions, 'app', false), 'methods')
  config.costomCtor ? config.costomCtor(finalAppOption) : global.currentCtor(finalAppOption)
}
