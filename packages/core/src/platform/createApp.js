import transferOptions from '../core/transferOptions'
import mergeOptions from '../core/mergeOptions'
import { dissolveAttrs, extend } from '../helper/utils'

export default function createApp (option) {
  const { rawOptions } = transferOptions(option, 'app', [{
    onLaunch () {
      extend(this, option.proto)
    }
  }])
  global.currentCtor(dissolveAttrs(mergeOptions(rawOptions, 'app', false), 'methods'))
  /* eslint-disable-line */
}
