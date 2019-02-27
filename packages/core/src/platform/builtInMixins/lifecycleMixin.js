import { is } from '../../helper/env'

export default function lifecycleMixin (type) {
  let options
  if (is('ali')) {
    options = {
      data: {
        mpxLifecycleHack: true
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
    if (type === 'page') {
      options = {
        data: {
          mpxDepth: 0
        }
      }
    } else {
      options = {
        properties: {
          mpxDepth: Number
        }
      }
    }
  }

  return options
}
