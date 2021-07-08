const BEHAVIORS_MAP = {
  'wx://form-field': 'dd://form-field',
  'wx://component-export': 'dd://component-export'
}

export default {
  convert (options) {
    if (options.behaviors) {
      options.behaviors.forEach((behavior, idx) => {
        if (typeof behavior === 'string' && BEHAVIORS_MAP[behavior]) {
          options.behaviors.splice(idx, 1, BEHAVIORS_MAP[behavior])
        }
      })
    }
  }
}
