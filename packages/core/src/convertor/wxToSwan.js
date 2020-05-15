import { error } from '../helper/log'
import { implemented } from '../core/implement'

const BEHAVIORS_MAP = {
  'wx://form-field': 'swan://form-field',
  'wx://component-export': 'swan://component-export'
}

const NOTSUPPORTS = ['moved', 'relations']

function convertErrorDesc (key) {
  error(`Options.${key} is not supported in runtime conversion from wx to swan.`, global.currentResource)
}

function notSupportTip (options) {
  NOTSUPPORTS.forEach(key => {
    if (options[key]) {
      if (!implemented[key]) {
        process.env.NODE_ENV !== 'production' && convertErrorDesc(key)
        delete options[key]
      } else if (implemented[key].remove) {
        delete options[key]
      }
    }
  })
}

export default {
  convert (options, type) {
    // todo fix swan onshow onload执行顺序
    if (options.behaviors) {
      options.behaviors.forEach((behavior, idx) => {
        if (typeof behavior === 'string' && BEHAVIORS_MAP[behavior]) {
          options.behaviors.splice(idx, 1, BEHAVIORS_MAP[behavior])
        }
      })
    }
    if (type === 'page' && !options.__pageCtor__) {
      options.options = options.options || {}
      options.options.addGlobalClass = true
    }
    notSupportTip(options)
  }
}
