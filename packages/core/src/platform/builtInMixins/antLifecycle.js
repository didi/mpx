import { MOUNTED } from '../../core/innerLifecycle'
import { is } from '../../helper/env'
export default function antLifecycle () {
  if (is('ant')) {
    return {
      [MOUNTED] () {
        typeof this.$rawOptions.didMount === 'function' && this.$rawOptions.didMount.call(this)
      }
    }
  }
}
