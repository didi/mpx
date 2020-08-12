import transferOptions from '../core/transferOptions'
import mergeOptions from '../core/mergeOptions'
import { dissolveAttrs } from '../helper/utils'

export default function createApp (option, config = {}) {
  const { rawOptions } = transferOptions(option, 'app', [{
    onLaunch () {
      Object.assign(this, option.proto)
    },
    created () {
      // onPageNotFound
      const { path, query, redirectedFrom = '' } = window.__mpxRouter.history.current
      const fromPath = redirectedFrom.split('?')[0]

      window.currentOption.onPageNotFound.call(this, {
        path: fromPath || path,
        query,
        isEntryPage: !!redirectedFrom
      })
    }
  }])
  const defaultOptions = mergeOptions(rawOptions, 'app', false)

  if (__mpx_mode__ === 'web') {
    global.currentOption = defaultOptions
    global.getApp = function () {
      return defaultOptions
    }
  } else {
    const finalAppOption = dissolveAttrs(defaultOptions, 'methods')
    const ctor = config.customCtor || global.currentCtor || App
    ctor(finalAppOption)
  }
}
