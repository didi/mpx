import { CREATED, MOUNTED } from '../../core/innerLifecycle'
import { is } from '../../helper/env'

export default function lifecycleMixin (type) {
  let options
  if (is('ali')) {
    options = {
      data: {
        mpxLifecycleHack: true
      },
      [MOUNTED] () {
        typeof this.$rawOptions.didMount === 'function' && this.$rawOptions.didMount.call(this)
        typeof this.$rawOptions.onReady === 'function' && this.$rawOptions.onReady.call(this)
      }
    }
    if (type === 'page') {
      options.data.mpxDepth = 0
    } else {
      options.props = {
        mpxDepth: 0
      }
    }
  } else if (is('wx') || is('swan')) {
    options = {
      [CREATED] () {
        typeof this.$rawOptions.created === 'function' && this.$rawOptions.created.call(this)
      }
    }
    if (type === 'page') {
      options.data = {
        mpxDepth: 0
      }
    } else {
      options.properties = {
        mpxDepth: Number
      }
    }
  }

  return options
}
