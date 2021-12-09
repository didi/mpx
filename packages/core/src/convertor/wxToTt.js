import { error } from '../helper/log'

export default {
  convert (options) {
    if (options.behaviors) {
      options.behaviors.forEach((behavior, idx) => {
        if (typeof behavior === 'string') {
          error(`Built-in behavior "${behavior}" is not supported in tt environment!`, global.currentResource)
          options.behaviors.splice(idx, 1)
        }
      })
    }
  }
}
