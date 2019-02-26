import { is } from '../../helper/env'
import { getLifecycleOptions } from '../lifecycle'

export default function lifecycleMixin (type) {
  let options
  if (is('ali')) {
    options = {
      data: {
        mpxLifecycleHack: true
      },
      ...getLifecycleOptions()
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
      ...getLifecycleOptions()
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
