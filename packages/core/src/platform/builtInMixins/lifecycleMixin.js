import { CREATED, MOUNTED } from '../../core/innerLifecycle'
import { is } from '../../helper/env'
export default function aliLifecycle (type) {
  if (is('ali')) {
    if (type === 'page') {
      return {
        data: {
          __lifecycle_hack__: true,
          __depth__: 0
        }
      }
    } else {
      return {
        props: {
          __depth__: 0
        },
        data: {
          __lifecycle_hack__: true
        },
        [MOUNTED] () {
          typeof this.$rawOptions.didMount === 'function' && this.$rawOptions.didMount.call(this)
        }
      }
    }
  } else if (is('wx')) {
    const options = {
      [CREATED] () {
        typeof this.$rawOptions.created === 'function' && this.$rawOptions.created.call(this)
      }
    }
    if (type === 'page') {
      options.data = {
        __depth__: 0
      }
    } else {
      options.properties = {
        __depth__: Number
      }
    }
    return options
  }
}
