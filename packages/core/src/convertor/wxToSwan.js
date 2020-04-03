const BEHAVIORS_MAP = {
  'wx://form-field': 'swan://form-field',
  'wx://component-export': 'swan://component-export'
}

export default {
  convert (options) {
    // todo fix swan onshow onload执行顺序
    if (options.behaviors) {
      options.behaviors.forEach((behavior, idx) => {
        if (typeof behavior === 'string' && BEHAVIORS_MAP[behavior]) {
          options.behaviors.splice(idx, 1, BEHAVIORS_MAP[behavior])
        }
      })
    }
  }
}
