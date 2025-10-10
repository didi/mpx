import { error } from '@mpxjs/utils'

const BEHAVIORS_MAP = [
  'wx://form-field',
  'wx://form-field-group',
  'wx://form-field-button',
  'wx://component-export'
]

export default {
  convert (options) {
    if (options.behaviors) {
      options.behaviors.forEach((behavior, idx) => {
        if (BEHAVIORS_MAP.includes(behavior)) {
          error(`Built-in behavior "${behavior}" is not supported in tt environment!`, global.currentResource || global.currentModuleId)
          options.behaviors.splice(idx, 1)
        }
      })
    }
  }
}
