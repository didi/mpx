import transferOptions from '../core/transferOptions'
import { dissolveAttrs, extend } from '../helper/utils'

export default function createApp (option) {
  const { rawOptions } = transferOptions(option, 'app', [{
    onLaunch () {
      extend(this, option.proto)
    }
  }])
  global.currentCtor(dissolveAttrs(rawOptions, 'methods'))
  /* eslint-disable-line */
}
